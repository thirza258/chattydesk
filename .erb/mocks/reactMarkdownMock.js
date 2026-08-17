/**
 * react-markdown ships ES modules, and jest does not transform node_modules —
 * importing it for real throws "Unexpected token 'export'". Rendering Markdown
 * is not what any of these tests check, so under test the component is a plain
 * pass-through for its children.
 */
module.exports = function ReactMarkdown({ children }) {
  return children;
};
