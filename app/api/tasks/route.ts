import { linearProjectIssues } from '@/lib/linear';

export const dynamic = 'force-dynamic';

function movedToLinear() {
  return Response.json({
    error: 'Project tasks are maintained in Linear. The local tracker is retired.',
    url: linearProjectIssues,
  }, { status: 410 });
}

export const GET = movedToLinear;
export const POST = movedToLinear;
