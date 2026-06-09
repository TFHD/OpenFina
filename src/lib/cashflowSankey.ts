import type { ExpenseSlice } from './expenseStats'

const NODE_WIDTH = 10
const PADDING = 16
const LABEL_AREA = 148
const MIN_TARGET_HEIGHT = 44
const NODE_GAP = 5
const FLOW_WIDTH = 420

export interface SankeyNode {
    id: string
    label: string
    value: number
    color: string
    x: number
    y: number
    width: number
    height: number
}

export interface SankeyLink {
    path: string
    color: string
    value: number
}

export interface ColoredExpenseSlice extends ExpenseSlice {
    color: string
}

export interface SankeyLayout {
    width: number
    height: number
    nodes: SankeyNode[]
    links: SankeyLink[]
}

function linkPath(
    x0: number,
    y0Start: number,
    y0End: number,
    x1: number,
    y1Start: number,
    y1End: number,
): string {
    const mid = (x0 + x1) / 2
    return [
        `M ${x0} ${y0Start}`,
        `C ${mid} ${y0Start} ${mid} ${y1Start} ${x1} ${y1Start}`,
        `L ${x1} ${y1End}`,
        `C ${mid} ${y1End} ${mid} ${y0End} ${x0} ${y0End}`,
        'Z',
    ].join(' ')
}

export function layoutCashflowSankey(
    income: number,
    expenses: ColoredExpenseSlice[],
): SankeyLayout {
    const totalExpenses = expenses.reduce((sum, slice) => sum + slice.amount, 0)
    if (totalExpenses <= 0 && income <= 0)
        return { width: 0, height: 0, nodes: [], links: [] }

    const targetHeights = expenses.map((slice) =>
        Math.max((slice.amount / totalExpenses) * 200, MIN_TARGET_HEIGHT),
    )
    const targetStackHeight =
        targetHeights.reduce((sum, h) => sum + h, 0) +
        Math.max(0, expenses.length - 1) * NODE_GAP

    const height = targetStackHeight + PADDING * 2
    const width = PADDING + NODE_WIDTH + FLOW_WIDTH + NODE_WIDTH + LABEL_AREA + PADDING

    const leftX = PADDING
    const rightBarX = leftX + NODE_WIDTH + FLOW_WIDTH
    const offsetY = PADDING

    const sourceValue = income > 0 ? income : totalExpenses
    const sourceHeight = Math.max(
        income > 0
        ? (income / Math.max(income, totalExpenses)) * targetStackHeight
        : targetStackHeight,
        12,
    )
    const sourceY = offsetY + (targetStackHeight - sourceHeight) / 2

    const sourceNode: SankeyNode = {
        id: 'source',
        label: income > 0 ? 'Entrées' : 'Sorties',
        value: sourceValue,
        color: income > 0 ? '#34d399' : '#f87171',
        x: leftX,
        y: sourceY,
        width: NODE_WIDTH,
        height: sourceHeight,
    }

    const targetNodes: SankeyNode[] = []
    let rightY = offsetY

    expenses.forEach((slice, index) => {
        const nodeHeight = targetHeights[index] ?? MIN_TARGET_HEIGHT
        targetNodes.push({
            id: slice.category,
            label: slice.label,
            value: slice.amount,
            color: slice.color,
            x: rightBarX,
            y: rightY,
            width: NODE_WIDTH,
            height: nodeHeight,
        })
        rightY += nodeHeight + NODE_GAP
    })

    const links: SankeyLink[] = []
    let sourceOffset = sourceY

    for (const target of targetNodes) {
        const share = target.value / totalExpenses
        const sourceBand = share * sourceHeight

        links.push({
            path: linkPath(
                sourceNode.x + sourceNode.width,
                sourceOffset,
                sourceOffset + sourceBand,
                target.x,
                target.y,
                target.y + target.height,
            ),
            color: target.color,
            value: target.value,
        })

        sourceOffset += sourceBand
    }

    return {
        width,
        height,
        nodes: [sourceNode, ...targetNodes],
        links,
    }
}
