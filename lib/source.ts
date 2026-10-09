import { defineDocs } from 'fumadocs-mdx/macro';
import { loader } from 'fumadocs-core/source';

// Published design-system usage docs. content/archive holds the retired local project snapshots; it is not routed.
const docs = defineDocs({ dir: 'content/docs' });
export const source = loader({ baseUrl: '/docs', source: docs.toFumadocsSource() });
