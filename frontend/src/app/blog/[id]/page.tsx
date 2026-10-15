import { Metadata } from 'next';
import { db } from '@/services/db';
import BlogDetailClient from './BlogDetailClient';

interface Props {
  params: Promise<{
    id: string;
  }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const idOrSlug = decodeURIComponent(id || '');

  try {
    const blog = await db.getBlogById(idOrSlug);
    if (blog) {
      const title = `${blog.title} | Final Attempt`;
      const description =
        blog.blurb ||
        (blog.content ? blog.content.replace(/<[^>]*>?/gm, '').slice(0, 155) : 'Read comprehensive UPSC and State PCS exam preparation insights and articles from Final Attempt.');
      const url = `https://finalattemptias.com/blog/${blog.slug || blog.id}`;
      
      const backendBase = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://finalattemptias.com';
      const rawImg = blog.imageUrl || blog.cover_image_url;
      const imageUrl = rawImg
        ? (rawImg.startsWith('http') ? rawImg : `${backendBase}/${rawImg.replace(/^\//, '')}`)
        : 'https://finalattemptias.com/og-image.jpg';

      return {
        title,
        description,
        alternates: {
          canonical: url,
        },
        openGraph: {
          title,
          description,
          url,
          siteName: 'Final Attempt',
          type: 'article',
          publishedTime: blog.publishDate || blog.createdAt,
          authors: [blog.author || 'Final Attempt'],
          images: [
            {
              url: imageUrl,
              alt: blog.title,
            },
          ],
          locale: 'en_IN',
        },
        twitter: {
          card: 'summary_large_image',
          title,
          description,
          images: [imageUrl],
        },
      };
    }
  } catch (err) {
    console.error('Failed to generate metadata for blog:', idOrSlug, err);
  }

  return {
    title: 'Editorial Article | Final Attempt',
    description: 'Read educational insights and guidance for UPSC and State PCS exam preparation.',
  };
}

export default async function BlogDetailPage({ params }: Props) {
  const { id } = await params;
  const idOrSlug = decodeURIComponent(id || '');
  let initialBlog = null;

  try {
    initialBlog = await db.getBlogById(idOrSlug);
  } catch {
    // fallback to client fetch
  }

  return <BlogDetailClient idOrSlug={idOrSlug} initialBlog={initialBlog} />;
}
