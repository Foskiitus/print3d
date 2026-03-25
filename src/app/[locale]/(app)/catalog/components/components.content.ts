import { t, type DeclarationContent } from "intlayer";
import { title } from "process";

const componentsContent = {
  key: "components",
  content: {
    page: {
      title: t({ pt: "Painel Componentes", en: "Components Panel" }),
      heading: t({ pt: "Painel Componentes", en: "Components Panel" }),
      description: t({
        pt: "Gestão de componentes.",
        en: "Manage components.",
      }),
    },
  },
} satisfies DeclarationContent;

export default componentsContent;
