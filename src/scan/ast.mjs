// AST scanner for JS/TS/JSX/TSX.
//
// A color/length only counts when it is an actual STYLE VALUE. Hexes in URLs,
// prose, Storybook titles, non-style attributes, or comments are structurally
// not style values, so they never fire. Property keys are tracked so spacing
// values (padding/margin/gap) can be told apart from other numbers.
//
// Style contexts: JSX style/sx/css objects, and styled/css/createGlobalStyle templates.
import { parse } from '@babel/parser';
import { colorsIn, isLengthProp, parseCssText } from './shared.mjs';

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

const keyName = k =>
  k?.type === 'Identifier' ? k.name : k?.type === 'StringLiteral' ? k.value : null;

// Candidates from a style object, recursing nested objects, tracking prop keys.
function fromStyleObject(obj, out) {
  for (const p of obj.properties) {
    if (p.type !== 'ObjectProperty') continue;
    const prop = keyName(p.key);
    const v = p.value;
    if (v.type === 'ObjectExpression') { fromStyleObject(v, out); continue; }

    let str = null;
    if (v.type === 'StringLiteral') str = v.value;
    else if (v.type === 'TemplateLiteral' && v.expressions.length === 0 && v.quasis.length === 1)
      str = v.quasis[0].value.cooked ?? '';
    else if (v.type === 'NumericLiteral') {
      if (isLengthProp(prop)) out.push({ kind: 'length', raw: String(v.value), line: v.loc.start.line, prop });
      continue;
    } else continue;

    const line = v.loc.start.line;
    for (const { raw } of colorsIn(str)) out.push({ kind: 'color', raw, line, prop });
    if (isLengthProp(prop)) for (const tok of str.trim().split(/\s+/)) out.push({ kind: 'length', raw: tok, line, prop });
  }
}

function isStyledTag(tag) {
  if (!tag) return false;
  if (tag.type === 'Identifier') return CSS_TAGS.has(tag.name);
  if (tag.type === 'MemberExpression') return tag.object?.name === 'styled';
  if (tag.type === 'CallExpression') return tag.callee?.name === 'styled' || tag.callee?.object?.name === 'styled';
  return false;
}

export function astScan(src) {
  const ast = parse(src, { sourceType: 'module', plugins: ['jsx', 'typescript'], errorRecovery: true });
  const out = [];
  walk(ast.program, n => {
    if (n.type === 'JSXOpeningElement') {
      const nm = n.name?.type === 'JSXIdentifier' ? n.name.name : null;
      if (nm && /^[a-z]/.test(nm)) { // raw HTML tag, not a <Component>
        const attrs = [];
        for (const a of n.attributes) if (a.type === 'JSXAttribute' && a.name?.name) attrs.push(a.name.name);
        out.push({ kind: 'element', tag: nm, line: n.loc.start.line, attrs });
      }
    }
    if (n.type === 'JSXAttribute' && STYLE_ATTRS.has(n.name?.name) &&
        n.value?.type === 'JSXExpressionContainer' &&
        n.value.expression?.type === 'ObjectExpression') {
      fromStyleObject(n.value.expression, out);
    } else if (n.type === 'TaggedTemplateExpression' && isStyledTag(n.tag)) {
      for (const q of n.quasi.quasis) {
        out.push(...parseCssText(q.value.cooked ?? '', q.loc.start.line - 1));
      }
    }
  });
  return out;
}
