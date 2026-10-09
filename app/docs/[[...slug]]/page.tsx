import { notFound, redirect } from 'next/navigation';
import { linearDocs } from '@/lib/linear';

export default async function Page({ params }: { params: Promise<{ slug?: string[] }> }) {
  const { slug } = await params;
  const destination = linearDocs[(slug ?? []).join('/')];
  if (!destination) notFound();
  redirect(destination);
}
