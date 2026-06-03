<!-- BEGIN:nextjs-agent-rules -->
USE bun.js For everything
BUILD_COMMAND: cd blu3-client && bun run build
TYPE_CHECK: cd blu3-client && npx tsc --noEmit
<!-- END:nextjs-agent-rules -->
