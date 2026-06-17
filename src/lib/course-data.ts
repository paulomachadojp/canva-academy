export type Lesson = {
  id: string;
  title: string;
  duration: string;
  youtubeId: string;
  description: string;
  materials: { name: string; size: string; url: string }[];
};

export type Module = {
  id: string;
  title: string;
  lessons: Lesson[];
};

const sampleMaterials = [
  { name: "Apostila da aula.pdf", size: "1.2 MB", url: "#" },
  { name: "Templates Canva.zip", size: "4.8 MB", url: "#" },
];

function makeLessons(prefix: string, titles: string[], youtubeIds: string[]): Lesson[] {
  return titles.map((title, i) => ({
    id: `${prefix}-${i + 1}`,
    title,
    duration: `${8 + (i % 6)}:${String(10 + i * 3).padStart(2, "0")}`,
    youtubeId: youtubeIds[i % youtubeIds.length],
    description:
      "Nesta aula você vai aprender conceitos práticos e aplicáveis no Canva. Assista até o final e baixe os materiais complementares para fixar o conteúdo.",
    materials: sampleMaterials,
  }));
}

const yt = ["dQw4w9WgXcQ", "ScMzIvxBSi4", "jNQXAC9IVRw", "9bZkp7q19f0"];

export const modules: Module[] = [
  {
    id: "introducao",
    title: "Introdução ao Canva",
    lessons: makeLessons("introducao", [
      "Boas-vindas ao curso",
      "Criando sua conta Canva",
      "Tour pela interface",
      "Tipos de projetos",
      "Salvando e exportando",
    ], yt),
  },
  {
    id: "ferramentas",
    title: "Ferramentas Essenciais",
    lessons: makeLessons("ferramentas", [
      "Elementos e formas",
      "Trabalhando com imagens",
      "Camadas e organização",
      "Textos e fontes",
      "Cores e fundos",
      "Templates inteligentes",
      "Animações básicas",
      "Atalhos do Canva",
    ], yt),
  },
  {
    id: "tipografia",
    title: "Tipografia e Cores",
    lessons: makeLessons("tipografia", [
      "Hierarquia tipográfica",
      "Combinando fontes",
      "Teoria das cores",
      "Paletas harmônicas",
      "Contraste e legibilidade",
      "Aplicando em peças",
    ], yt),
  },
  {
    id: "layouts",
    title: "Layouts e Composição",
    lessons: makeLessons("layouts", [
      "Grid e alinhamento",
      "Regra dos terços",
      "Espaço em branco",
      "Composição visual",
      "Layouts responsivos",
      "Templates profissionais",
      "Revisão prática",
    ], yt),
  },
  {
    id: "branding",
    title: "Branding Visual",
    lessons: makeLessons("branding", [
      "O que é identidade visual",
      "Criando um logotipo",
      "Manual de marca",
      "Aplicações de marca",
      "Brand kit no Canva",
      "Cases reais",
    ], yt),
  },
  {
    id: "projetos",
    title: "Projetos Práticos",
    lessons: makeLessons("projetos", [
      "Post para Instagram",
      "Story animado",
      "Carrossel profissional",
      "Apresentação de pitch",
      "Cartão de visita",
      "Flyer promocional",
      "Capa de YouTube",
      "Currículo criativo",
      "E-book simples",
      "Projeto final",
    ], yt),
  },
];

export function findModule(id: string) {
  return modules.find((m) => m.id === id);
}

export function findLesson(moduleId: string, lessonId: string) {
  const mod = findModule(moduleId);
  if (!mod) return null;
  const lesson = mod.lessons.find((l) => l.id === lessonId);
  if (!lesson) return null;
  return { mod, lesson };
}

export const totalLessons = modules.reduce((a, m) => a + m.lessons.length, 0);
