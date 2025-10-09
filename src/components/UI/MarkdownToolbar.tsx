import { Stack, IconButton, Tooltip } from '@mui/material';
import FormatBoldIcon from '@mui/icons-material/FormatBold';
import FormatItalicIcon from '@mui/icons-material/FormatItalic';
import LinkIcon from '@mui/icons-material/Link';
import CodeIcon from '@mui/icons-material/Code';
import TitleIcon from '@mui/icons-material/Title';
import FormatQuoteIcon from '@mui/icons-material/FormatQuote';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';
import HorizontalRuleIcon from '@mui/icons-material/HorizontalRule';
import ChecklistIcon from '@mui/icons-material/Checklist';
import ImageIcon from '@mui/icons-material/Image';
import TableChartIcon from '@mui/icons-material/TableChart';

type Props = {
  get: () => string;
  set: (next: string) => void;
};

function surround(get: () => string, set: (s: string) => void, before: string, after: string) {
  const value = get();
  const next = `${before}${value}${after}`;
  set(next);
}

export default function MarkdownToolbar({ get, set }: Props) {
  return (
    <Stack direction="row" spacing={0.5} sx={{ mb: 1 }}>
      <Tooltip title="H1"><IconButton size="small" onClick={() => set(`# ${get()}`)}><TitleIcon fontSize="small" /></IconButton></Tooltip>
      <Tooltip title="H2"><IconButton size="small" onClick={() => set(`## ${get()}`)}><TitleIcon fontSize="small" /></IconButton></Tooltip>
      <Tooltip title="H3"><IconButton size="small" onClick={() => set(`### ${get()}`)}><TitleIcon fontSize="small" /></IconButton></Tooltip>
      <Tooltip title="Bold"><IconButton size="small" onClick={() => surround(get, set, '**', '**')}><FormatBoldIcon fontSize="small" /></IconButton></Tooltip>
      <Tooltip title="Italic"><IconButton size="small" onClick={() => surround(get, set, '*', '*')}><FormatItalicIcon fontSize="small" /></IconButton></Tooltip>
      <Tooltip title="Link"><IconButton size="small" onClick={() => set(`${get()} [text](https://)`)}><LinkIcon fontSize="small" /></IconButton></Tooltip>
      <Tooltip title="Inline code"><IconButton size="small" onClick={() => surround(get, set, '`', '`')}><CodeIcon fontSize="small" /></IconButton></Tooltip>
      <Tooltip title="Code block"><IconButton size="small" onClick={() => set(`${get()}\n\n\`\`\`ts\n// code\n\`\`\`\n`)}><CodeIcon fontSize="small" /></IconButton></Tooltip>
      <Tooltip title="Quote"><IconButton size="small" onClick={() => set(`${get()}\n> цитата`)}><FormatQuoteIcon fontSize="small" /></IconButton></Tooltip>
      <Tooltip title="List"><IconButton size="small" onClick={() => set(`${get()}\n- item\n- item`)}><FormatListBulletedIcon fontSize="small" /></IconButton></Tooltip>
      <Tooltip title="Numbered list"><IconButton size="small" onClick={() => set(`${get()}\n1. item\n2. item`)}><FormatListNumberedIcon fontSize="small" /></IconButton></Tooltip>
      <Tooltip title="Checklist"><IconButton size="small" onClick={() => set(`${get()}\n- [ ] task\n- [x] done`)}><ChecklistIcon fontSize="small" /></IconButton></Tooltip>
      <Tooltip title="Image"><IconButton size="small" onClick={() => set(`${get()}\n![](https://)`)}><ImageIcon fontSize="small" /></IconButton></Tooltip>
      <Tooltip title="Table"><IconButton size="small" onClick={() => set(`${get()}\n\n| Колонка | Колонка |\n|---|---|\n| ячейка | ячейка |`)}><TableChartIcon fontSize="small" /></IconButton></Tooltip>
      <Tooltip title="Horizontal rule"><IconButton size="small" onClick={() => set(`${get()}\n\n---\n`)}><HorizontalRuleIcon fontSize="small" /></IconButton></Tooltip>
    </Stack>
  );
}

