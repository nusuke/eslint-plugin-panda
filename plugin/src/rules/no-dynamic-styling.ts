import type { TSESTree } from '@typescript-eslint/utils'
import { type Rule, createRule } from '../utils'
import { isInPandaFunction, isPandaAttribute, isPandaProp, isRecipeVariant } from '../utils/helpers'
import {
  isIdentifier,
  isJSXExpressionContainer,
  isLiteral,
  isObjectExpression,
  isTemplateLiteral,
} from '../utils/nodes'

export const RULE_NAME = 'no-dynamic-styling'

const rule: Rule = createRule({
  name: RULE_NAME,
  meta: {
    docs: {
      description:
        "Ensure user doesn't use dynamic styling at any point. \nPrefer to use static styles, leverage css variables or recipes for known dynamic styles.",
    },
    messages: {
      dynamic: 'Remove dynamic value. Prefer static styles',
      dynamicProperty: 'Remove dynamic property. Prefer static style property',
      dynamicRecipeVariant: 'Remove dynamic variant. Prefer static variant definition',
    },
    type: 'suggestion',
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    return {
      JSXAttribute(node) {
        if (!node.value) return
        if (isLiteral(node.value)) return
        if (isJSXExpressionContainer(node.value) && isLiteral(node.value.expression)) return

        // For syntax like: <Circle property={`value that could be multiline`} />
        if (
          isJSXExpressionContainer(node.value) &&
          isTemplateLiteral(node.value.expression) &&
          node.value.expression.expressions.length === 0
        )
          return

        // Don't warn for objects. Those are conditions
        if (isObjectExpression(node.value.expression)) return

        if (!isPandaProp(node, context)) return

        context.report({
          node: node.value,
          messageId: 'dynamic',
        })
      },

      'Property[computed=true]'(node: TSESTree.Property) {
        if (!isInPandaFunction(node, context)) return

        context.report({
          node: node.key,
          messageId: isRecipeVariant(node, context) ? 'dynamicRecipeVariant' : 'dynamicProperty',
        })
      },

      Property(node) {
        if (!isIdentifier(node.key)) return
        if (isLiteral(node.value)) return

        // For syntax like: { property: `value that could be multiline` }
        if (isTemplateLiteral(node.value) && node.value.expressions.length === 0) return

        // Don't warn for objects. Those are conditions
        if (isObjectExpression(node.value)) return

        if (!isPandaAttribute(node, context)) return

        context.report({
          node: node.value,
          messageId: 'dynamic',
        })
      },
    }
  },
})

export default rule
