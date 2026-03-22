import { t, type DeclarationContent } from "intlayer";

const termsContent = {
  key: "terms",
  content: {
    meta: {
      title: t({ en: "Terms of Service", pt: "Termos de Serviço" }),
      description: t({
        en: "The terms and conditions governing your use of SpoolIQ.",
        pt: "Os termos e condições que regem a tua utilização da SpoolIQ.",
      }),
    },

    hero: {
      title: t({ en: "Terms of Service", pt: "Termos de Serviço" }),
      lastUpdated: t({ en: "Last updated", pt: "Última actualização" }),
      date: t({ en: "March 2026", pt: "Março 2026" }),
      intro: t({
        en: "By using SpoolIQ, you agree to these terms. Please read them carefully.",
        pt: "Ao utilizar a SpoolIQ, concordas com estes termos. Por favor lê-os com atenção.",
      }),
    },

    sections: {
      service: {
        title: t({ en: "The service", pt: "O serviço" }),
        body: t({
          en: "SpoolIQ is a production management platform designed for 3D printing businesses. It allows you to manage suppliers, clients, filaments, and production records. We reserve the right to modify or discontinue the service at any time with reasonable notice.",
          pt: "A SpoolIQ é uma plataforma de gestão de produção concebida para negócios de impressão 3D. Permite gerir fornecedores, clientes, filamentos e registos de produção. Reservamo-nos o direito de modificar ou descontinuar o serviço em qualquer momento com aviso prévio razoável.",
        }),
      },

      account: {
        title: t({ en: "Your account", pt: "A tua conta" }),
        items: {
          eligibility: t({
            en: "You must be at least 18 years old to use SpoolIQ.",
            pt: "Deves ter pelo menos 18 anos para utilizar a SpoolIQ.",
          }),
          accuracy: t({
            en: "You are responsible for providing accurate account information and keeping it up to date.",
            pt: "És responsável por fornecer informações de conta precisas e mantê-las actualizadas.",
          }),
          security: t({
            en: "You are responsible for maintaining the security of your account credentials. Notify us immediately of any unauthorised access.",
            pt: "És responsável por manter a segurança das credenciais da tua conta. Notifica-nos imediatamente de qualquer acesso não autorizado.",
          }),
          oneAccount: t({
            en: "Each account is for a single user. You may not share your account with others.",
            pt: "Cada conta é para um único utilizador. Não podes partilhar a tua conta com outros.",
          }),
        },
      },

      acceptableUse: {
        title: t({ en: "Acceptable use", pt: "Utilização aceitável" }),
        intro: t({
          en: "You agree not to use SpoolIQ to:",
          pt: "Concordas em não utilizar a SpoolIQ para:",
        }),
        items: {
          illegal: t({
            en: "Engage in any illegal or fraudulent activity.",
            pt: "Realizar qualquer actividade ilegal ou fraudulenta.",
          }),
          harm: t({
            en: "Harm, harass or impersonate others.",
            pt: "Prejudicar, assediar ou fazer-se passar por outros.",
          }),
          scraping: t({
            en: "Scrape, copy or redistribute platform content without permission.",
            pt: "Fazer scraping, copiar ou redistribuir conteúdo da plataforma sem permissão.",
          }),
          interference: t({
            en: "Interfere with or disrupt the platform's infrastructure.",
            pt: "Interferir ou perturbar a infraestrutura da plataforma.",
          }),
        },
      },

      payments: {
        title: t({ en: "Payments and billing", pt: "Pagamentos e facturação" }),
        body: t({
          en: "Paid plans are billed in advance on a monthly or annual basis. All payments are processed securely by Stripe. Prices are shown excluding VAT where applicable. You may cancel your subscription at any time; access continues until the end of the current billing period. We do not offer refunds for partial periods.",
          pt: "Os planos pagos são cobrados antecipadamente numa base mensal ou anual. Todos os pagamentos são processados de forma segura pela Stripe. Os preços são apresentados sem IVA quando aplicável. Podes cancelar a tua subscrição em qualquer momento; o acesso continua até ao final do período de facturação actual. Não oferecemos reembolsos por períodos parciais.",
        }),
      },

      data: {
        title: t({ en: "Your data", pt: "Os teus dados" }),
        body: t({
          en: "You own the data you enter into SpoolIQ. We do not claim any rights over it. You are responsible for ensuring that the data you upload does not infringe any third-party rights. Upon account deletion, your data will be permanently removed within 30 days.",
          pt: "És proprietário dos dados que introduzes na SpoolIQ. Não reivindicamos quaisquer direitos sobre eles. És responsável por garantir que os dados que carregas não violam direitos de terceiros. Após a eliminação da conta, os teus dados serão removidos permanentemente num prazo de 30 dias.",
        }),
      },

      intellectualProperty: {
        title: t({
          en: "Intellectual property",
          pt: "Propriedade intelectual",
        }),
        body: t({
          en: "SpoolIQ and its original content, features and functionality are owned by SpoolIQ and protected by applicable intellectual property laws. You may not copy, modify or distribute any part of the platform without our written permission.",
          pt: "A SpoolIQ e o seu conteúdo original, funcionalidades e características são propriedade da SpoolIQ e estão protegidos pelas leis de propriedade intelectual aplicáveis. Não podes copiar, modificar ou distribuir qualquer parte da plataforma sem a nossa autorização escrita.",
        }),
      },

      liability: {
        title: t({
          en: "Limitation of liability",
          pt: "Limitação de responsabilidade",
        }),
        body: t({
          en: "SpoolIQ is provided 'as is' without warranties of any kind. To the fullest extent permitted by law, we shall not be liable for any indirect, incidental or consequential damages arising from your use of the platform.",
          pt: "A SpoolIQ é fornecida 'tal como está' sem garantias de qualquer tipo. Na máxima extensão permitida por lei, não seremos responsáveis por quaisquer danos indirectos, incidentais ou consequentes decorrentes da tua utilização da plataforma.",
        }),
      },

      termination: {
        title: t({ en: "Termination", pt: "Rescisão" }),
        body: t({
          en: "We may suspend or terminate your account if you violate these terms. You may delete your account at any time from your account settings. Upon termination, your right to use the service ceases immediately.",
          pt: "Podemos suspender ou encerrar a tua conta se violares estes termos. Podes eliminar a tua conta em qualquer momento nas definições da conta. Após a rescisão, o teu direito de utilizar o serviço cessa imediatamente.",
        }),
      },

      governing: {
        title: t({ en: "Governing law", pt: "Lei aplicável" }),
        body: t({
          en: "These terms are governed by the laws of Portugal and the European Union. Any disputes shall be subject to the exclusive jurisdiction of the Portuguese courts.",
          pt: "Estes termos são regidos pela legislação de Portugal e da União Europeia. Quaisquer litígios estarão sujeitos à jurisdição exclusiva dos tribunais portugueses.",
        }),
      },

      changes: {
        title: t({
          en: "Changes to these terms",
          pt: "Alterações a estes termos",
        }),
        body: t({
          en: "We may update these terms from time to time. We will notify you of significant changes by email. Continued use of SpoolIQ after changes constitutes acceptance of the updated terms.",
          pt: "Podemos actualizar estes termos periodicamente. Notificaremos sobre alterações significativas por email. A utilização continuada da SpoolIQ após as alterações constitui aceitação dos termos actualizados.",
        }),
      },

      contact: {
        title: t({ en: "Contact", pt: "Contacto" }),
        body: t({
          en: "If you have any questions about these terms, please contact us at legal@spooliq.app.",
          pt: "Se tiveres alguma questão sobre estes termos, contacta-nos em legal@spooliq.app.",
        }),
      },
    },
  },
} satisfies DeclarationContent;

export default termsContent;
