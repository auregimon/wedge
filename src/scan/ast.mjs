// AST scanner for JS/TS/JSX/TSX.
//
// The whole point: a color literal only counts when it is an actual STYLE VALUE.
// A hex inside a URL string, a log message, a Storybook title, a non-style JSX
// attribute, or a comment is structurally NOT a style value, so it never fires.
// That is the precision a regex pass cannot have.
//
// Style contexts recognized:
//   • JSX style / sx / css attributes holding an object  -> string values within
//   • styled.x`…`, styled(C)`…`, css`…`, createGlobalStyle`…`  -> the CSS quasis
import { parse } from '@babel/parser';
import { colorsIn } from './shared.mjs';

const STYLE_ATTRS = new Set(['style', 'sx', 'css']);
const CSS_TAGS = new Set(['css', 'createGlobalStyle', 'keyframes']);

function walk(node, visit) {
  if (!node || typeof node.type !== 'string') return;
  visit(node);
  for (const key of Object.keys(node)) {
    if (key === 'loc' || key === 'start' || key === 'end' ||
        key === 'leadingComments' || key === 'trailingComments' || key === 'comments') continue;
    const v = node[key];
    if (Array.isArray(v)) { for (const c of v) walk(c, visit); }
    else walk(v, visit);
  }
}

// Color literals from string values inside a style object (recurses nesting).
function colorsFromObject(obj, out) {
  walk(obj, n => {
    if (n.type === 'StringLiteral') {
      for (const { raw } of colorsIn(n.value)) out.push({ raw, line: n.loc.start.line });
    } else if (n.type === 'TemplateLiteral' && n.expressions.length === 0 && n.quasis.length === 1) {
      const q = n.quasis[0];
      for (const { raw } of colorsIn(q.value.cooked ?? '')) out.push({ raw, line: q.loc.start.line });
    }
  });
}

function isStyledTag(tag) {
  if (!tag) return false;
  if (tag.type === 'Identifier') return CSS_TAGS.has(tag.name);                       // css`…`
  if (tag.type === 'MemberExpression') return tag.object?.name === 'styled';          // styled.div`…`
  if (tag.type === 'CallExpression') {                                                // styled(C)`…`
    const c = tag.callee;
    return c?.name === 'styled' || c?.object?.name === 'styled';
  }
  return false;
}

// Color literals from the static CSS text of a tagged template (skips ${…}).
function colorsFromTemplate(quasi, out) {
  for (const q of quasi.quasis) {
    const cooked = q.value.cooked ?? '';
    const before = cooked.split(/\r?\n/);
    for (const { raw, index } of colorsIn(cooked)) {
      const nl = cooked.slice(0, index).split('\n').length - 1;
      out.push({ raw, line: q.loc.start.line + nl });
    }
    void before;
  }
}

export function astScan(src) {
  const ast = parse(src, {
    sourceType: 'module',
    plugins: ['jsx', 'typescript'],
    errorRecovery: true,
  });
  const out = [];
  walk(ast.program, n => {
    if (n.type === 'JSXAttribute' && STYLE_ATTRS.has(n.name?.name) &&
        n.value?.type === 'JSXExpressionContainer' &&
        n.value.expression?.type === 'ObjectExpression') {
      colorsFromObject(n.value.expression, out);
    } else if (n.type === 'TaggedTemplateExpression' && isStyledTag(n.tag)) {
      colorsFromTemplate(n.quasi, out);
    }
  });
  return out;
}
