import { join } from 'node:path';
import process from 'node:process';
import fg from 'fast-glob';
import fs from 'fs-extra';
import { IS_PROD, OUR_DOMAIN } from '@/constants';
import { consoleLog } from '@/lib/console';
import { renderMarkdown } from '@/markdown';

export const getAllPostFiles = async () => await fg('posts/**/*.mdx');

let memoedAllPosts: Record<string, any>[] = [];

export async function getAllPosts() {
  // 开发环境每次都重新读取文件
  if (!IS_PROD) {
    memoedAllPosts = [];
  }

  if (memoedAllPosts.length) {
    return memoedAllPosts;
  }

  const postFiles = await getAllPostFiles();

  const posts = (
    await Promise.all(
      postFiles.map(async (file) => {
        const slug = file.replace(/^posts\/(.+)\.mdx$/, '$1');
        const code = await fs.readFile(join(process.cwd(), file), 'utf-8');

        const rendered = renderMarkdown({ content: code });

        const renderedMetadata = rendered.toMetadata();

        const frontMatter = renderedMetadata.frontMatter;

        // 尝试获取AI摘要
        let summary = await getSummaryFromCache(slug);

        if (!summary) {
          // 如果缓存中没有摘要，则生成新的摘要
          summary = await getAiSummary(code);
          // 只有在摘要生成成功时才保存到缓存
          // saveSummaryToCache 函数内部会检查摘要内容是否包含错误信息
          if (summary) {
            await saveSummaryToCache(slug, summary);
          }
        }

        return {
          slug,
          code,
          summary,
          ...frontMatter,
        } as Record<string, any>;
      }),
    )
  )
    .filter(Boolean)
    .filter((post) => (IS_PROD ? post.published : true))
    .sort((a, b) => +new Date(b.createdTime) - +new Date(a.createdTime));

  memoedAllPosts = posts;

  return posts;
}

/**
 * 获取AI摘要的函数
 * 尝试从API获取文章摘要，处理超时和错误情况
 * @param content 文章内容
 * @returns 生成的摘要或错误信息
 */
async function getAiSummary(content: string): Promise<string | null> {
  try {
    // 获取当前环境的API URL
    // 在服务器端渲染时使用相对路径，在客户端使用完整URL
    const apiUrl = IS_PROD ? '/api/ai/summary' : `${OUR_DOMAIN}/api/ai/summary`;

    consoleLog('INFO', '[AI] 正在调用摘要API: ', apiUrl);

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      consoleLog('ERROR', '[AI] Failed to generate summary:', errorText);

      // 尝试解析错误响应
      try {
        const errorData = JSON.parse(errorText);
        // 如果API返回了摘要（即使是错误情况下的备用摘要），则使用它
        if (errorData.summary) {
          return errorData.summary;
        }
      } catch (e) {
        consoleLog('ERROR', '[AI] Error parsing error response:', e);
      }

      return `无法生成AI摘要: ${response.status} ${response.statusText}`;
    }

    const data = await response.json();
    if (!data.summary) {
      return '未能获取有效的AI摘要。';
    }

    return data.summary;
  } catch (error) {
    consoleLog('ERROR', 'Error generating summary:', error);
    return error instanceof Error
      ? `生成摘要时出错: ${error.message}`
      : '生成摘要时出现未知错误。';
  }
}

// 检查摘要缓存文件是否存在
async function getSummaryFromCache(slug: string): Promise<string | null> {
  const summaryPath = join(process.cwd(), 'posts', '.summaries', `${slug}.txt`);
  try {
    if (await fs.pathExists(summaryPath)) {
      return await fs.readFile(summaryPath, 'utf-8');
    }
  } catch (error) {
    consoleLog('ERROR', 'Error reading summary cache:', error);
  }
  return null;
}

// 保存摘要到缓存
async function saveSummaryToCache(
  slug: string,
  summary: string,
): Promise<void> {
  // 检查摘要内容是否包含错误信息，如果包含则不保存
  if (
    summary.includes('生成摘要时出错') ||
    summary.includes('无法生成AI摘要') ||
    summary.includes('生成AI摘要时出现错误') ||
    summary.includes('客户端请求超时') ||
    summary.includes('API请求超时')
  ) {
    consoleLog('INFO', `摘要生成失败，不保存缓存文件: ${slug}`);
    return;
  }

  const summaryDir = join(process.cwd(), 'posts', '.summaries');
  const summaryPath = join(summaryDir, `${slug}.txt`);
  try {
    await fs.ensureDir(summaryDir);
    await fs.writeFile(summaryPath, summary);
    consoleLog('INFO', `摘要缓存已保存: ${slug}`);
  } catch (error) {
    consoleLog('ERROR', 'Error saving summary cache:', error);
  }
}

export async function getPostBySlug(slug: string) {
  if (IS_PROD) {
    const posts = await getAllPosts();
    const post = posts.find((post) => post.slug === slug);
    return post;
  }

  // 开发环境：查找匹配的文件（支持子目录）
  const postFiles = await getAllPostFiles();
  const targetFile = postFiles.find((file) => {
    const fileSlug = file.replace(/^posts\/(.+)\.mdx$/, '$1');
    return fileSlug === slug;
  });

  if (!targetFile) return null;

  const code = fs.readFileSync(join(process.cwd(), targetFile), 'utf-8');
  const rendered = renderMarkdown({ content: code });
  const renderedMetadata = rendered.toMetadata();
  const frontMatter = renderedMetadata.frontMatter;

  // 尝试获取AI摘要
  let summary = await getSummaryFromCache(slug);

  if (!summary) {
    // 如果缓存中没有摘要，则生成新的摘要
    summary = await getAiSummary(code);
    // 只有在摘要生成成功时才保存到缓存
    // saveSummaryToCache 函数内部会检查摘要内容是否包含错误信息
    if (summary) {
      await saveSummaryToCache(slug, summary);
    }
  }

  return { slug, code, summary, ...frontMatter };
}

/**
 * 获取所有标签及其文章数量
 * @returns 标签数组，包含标签名和文章数量
 */
export async function getAllTags() {
  const posts = await getAllPosts();
  const tagCount = new Map<string, number>();

  posts.forEach((post) => {
    if (post.tags && Array.isArray(post.tags)) {
      post.tags.forEach((tag: string) => {
        tagCount.set(tag, (tagCount.get(tag) || 0) + 1);
      });
    }
  });

  return Array.from(tagCount.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count); // 按文章数量降序排列
}
