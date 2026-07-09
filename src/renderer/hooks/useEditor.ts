import { useEditor as useTipTap } from '@tiptap/react'
import Document from '@tiptap/extension-document'
import Paragraph from '@tiptap/extension-paragraph'
import Text from '@tiptap/extension-text'
import Heading from '@tiptap/extension-heading'
import Bold from '@tiptap/extension-bold'
import Underline from '@tiptap/extension-underline'
import Strike from '@tiptap/extension-strike'
import BulletList from '@tiptap/extension-bullet-list'
import OrderedList from '@tiptap/extension-ordered-list'
import ListItem from '@tiptap/extension-list-item'
import History from '@tiptap/extension-history'
import Table from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import Dropcursor from '@tiptap/extension-dropcursor'
import TextStyle from '@tiptap/extension-text-style'
import FontFamily from '@tiptap/extension-font-family'
import { MathInline } from '../components/Editor/extensions/MathInline'
import { MathTemplate } from '../components/Editor/extensions/MathTemplate'
import { Pagination } from '../components/Editor/extensions/Pagination'
import { DragHandle } from '../components/Editor/extensions/DragHandle'
import { CartesianPlane } from '../components/Editor/extensions/CartesianPlane'
import { DiscreteGraph } from '../components/Editor/extensions/DiscreteGraph'
import { PlotlyChart } from '../components/Editor/extensions/PlotlyChart'
import { MermaidBlock } from '../components/Editor/extensions/MermaidBlock'
import { ImageExtension } from '../components/Editor/extensions/ImageExtension'
import { ColumnBlock, Column } from '../components/Editor/extensions/Columns'
import { Gapcursor } from '../components/Editor/extensions/Gapcursor'
import { PostIt } from '../components/Editor/extensions/PostIt'
import { Flashcard } from '../components/Editor/extensions/Flashcard'
import { FontSize } from '../components/Editor/extensions/FontSize'
import { useNotebookStore } from '../store/notebookStore'

export function useEditor() {
  return useTipTap({
    onUpdate: () => useNotebookStore.getState().setDirty(true),
    extensions: [
      Document,
      Paragraph,
      Text,
      Heading.configure({ levels: [1, 2, 3] }),
      Bold,
      Underline,
      Strike,
      BulletList,
      OrderedList,
      ListItem,
      History,
      TextStyle,
      FontFamily,
      FontSize,
      Table.configure({ resizable: false }),
      TableRow,
      TableCell,
      TableHeader,
      MathInline,
      MathTemplate,
      CartesianPlane,
      DiscreteGraph,
      PlotlyChart,
      MermaidBlock,
      ColumnBlock,
      Column,
      Gapcursor,
      ImageExtension,
      PostIt,
      Flashcard,
      Pagination,
      DragHandle,
      Dropcursor.configure({ color: '#3b82f6', width: 2 }),
    ],
    autofocus: 'end',
    content: '<p></p>',
    editorProps: {
      attributes: { class: 'outline-none' },
    },
  })
}
