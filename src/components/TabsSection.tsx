import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";

interface Props {
  active: string;
  onChange: (tab: string) => void;
}

const TabsSection = ({ active, onChange }: Props) => {
  return (
    <section
      style={{
        margin: "12px 0 16px",
        display: "flex",
        justifyContent: "flex-start",
      }}
    >
      <Tabs
        value={active}
        onChange={(_, v) => onChange(v)}
        sx={{ minHeight: 44 }}
      >
        <Tab value="problems-home" label="Главная (Задачи)" />
        <Tab value="problems" label="Задачи" />
      </Tabs>
    </section>
  );
};

export default TabsSection;
