import { t, type DeclarationContent } from "intlayer";

const privacyContent = {
  key: "privacy",
  content: {
    meta: {
      title: t({ en: "Privacy Policy", pt: "Política de Privacidade" }),
      description: t({
        en: "How SpoolIQ collects, uses and protects your data.",
        pt: "Como a SpoolIQ recolhe, utiliza e protege os teus dados.",
      }),
    },

    hero: {
      title: t({ en: "Privacy Policy", pt: "Política de Privacidade" }),
      lastUpdated: t({ en: "Last updated", pt: "Última actualização" }),
      date: t({ en: "March 2026", pt: "Março 2026" }),
      intro: t({
        en: "At SpoolIQ, we take your privacy seriously. This policy explains what data we collect, why we collect it, and how we keep it safe.",
        pt: "Na SpoolIQ, levamos a tua privacidade a sério. Esta política explica que dados recolhemos, por que razão os recolhemos e como os mantemos seguros.",
      }),
    },

    sections: {
      dataCollected: {
        title: t({ en: "Data we collect", pt: "Dados que recolhemos" }),
        intro: t({
          en: "We collect only the data necessary to provide the SpoolIQ service:",
          pt: "Recolhemos apenas os dados necessários para fornecer o serviço SpoolIQ:",
        }),
        items: {
          account: t({
            en: "Account data — your name and email address, used to create and manage your account.",
            pt: "Dados de conta — o teu nome e endereço de email, utilizados para criar e gerir a tua conta.",
          }),
          appData: t({
            en: "Application data — information you enter into the platform, such as suppliers, clients, filaments and production records.",
            pt: "Dados da aplicação — informação que introduzes na plataforma, como fornecedores, clientes, filamentos e registos de produção.",
          }),
          payments: t({
            en: "Payment data — if you subscribe to a paid plan, payments are processed securely by Stripe. SpoolIQ does not store your card details.",
            pt: "Dados de pagamento — se subscreveres um plano pago, os pagamentos são processados de forma segura pela Stripe. A SpoolIQ não armazena os dados do teu cartão.",
          }),
          usage: t({
            en: "Usage data — anonymous technical data such as pages visited and features used, to help us improve the platform.",
            pt: "Dados de utilização — dados técnicos anónimos como páginas visitadas e funcionalidades usadas, para nos ajudar a melhorar a plataforma.",
          }),
        },
      },

      howWeUse: {
        title: t({
          en: "How we use your data",
          pt: "Como utilizamos os teus dados",
        }),
        items: {
          service: t({
            en: "To provide and maintain the SpoolIQ service.",
            pt: "Para fornecer e manter o serviço SpoolIQ.",
          }),
          communication: t({
            en: "To send transactional emails such as account confirmation and password reset.",
            pt: "Para enviar emails transaccionais como confirmação de conta e recuperação de palavra-passe.",
          }),
          billing: t({
            en: "To process payments and manage your subscription.",
            pt: "Para processar pagamentos e gerir a tua subscrição.",
          }),
          improvement: t({
            en: "To analyse usage patterns and improve the platform.",
            pt: "Para analisar padrões de utilização e melhorar a plataforma.",
          }),
        },
      },

      dataSharing: {
        title: t({ en: "Data sharing", pt: "Partilha de dados" }),
        body: t({
          en: "We do not sell or rent your personal data to third parties. We share data only with trusted service providers necessary to operate SpoolIQ — namely Supabase (database and authentication) and Stripe (payments). These providers are bound by strict data protection agreements.",
          pt: "Não vendemos nem alugamos os teus dados pessoais a terceiros. Partilhamos dados apenas com fornecedores de serviços de confiança necessários para operar a SpoolIQ — nomeadamente a Supabase (base de dados e autenticação) e a Stripe (pagamentos). Estes fornecedores estão vinculados por acordos rigorosos de protecção de dados.",
        }),
      },

      dataRetention: {
        title: t({ en: "Data retention", pt: "Retenção de dados" }),
        body: t({
          en: "We retain your data for as long as your account is active. If you delete your account, your personal data and all associated records will be permanently deleted within 30 days.",
          pt: "Conservamos os teus dados enquanto a tua conta estiver activa. Se eliminares a tua conta, os teus dados pessoais e todos os registos associados serão eliminados permanentemente num prazo de 30 dias.",
        }),
      },

      yourRights: {
        title: t({ en: "Your rights", pt: "Os teus direitos" }),
        intro: t({
          en: "Under GDPR, you have the right to:",
          pt: "Ao abrigo do RGPD, tens o direito de:",
        }),
        items: {
          access: t({
            en: "Access the personal data we hold about you.",
            pt: "Aceder aos dados pessoais que detemos sobre ti.",
          }),
          rectification: t({
            en: "Correct any inaccurate data.",
            pt: "Corrigir dados incorrectos.",
          }),
          erasure: t({
            en: "Request deletion of your data.",
            pt: "Solicitar a eliminação dos teus dados.",
          }),
          portability: t({
            en: "Receive your data in a portable format.",
            pt: "Receber os teus dados num formato portátil.",
          }),
          objection: t({
            en: "Object to certain types of processing.",
            pt: "Opor-te a determinados tipos de tratamento.",
          }),
        },
        contact: t({
          en: "To exercise any of these rights, please contact us at privacy@spooliq.app.",
          pt: "Para exercer qualquer um destes direitos, contacta-nos em privacy@spooliq.app.",
        }),
      },

      cookies: {
        title: t({ en: "Cookies", pt: "Cookies" }),
        body: t({
          en: "SpoolIQ uses only essential cookies required for authentication and session management. We do not use advertising or tracking cookies.",
          pt: "A SpoolIQ utiliza apenas cookies essenciais necessários para autenticação e gestão de sessão. Não utilizamos cookies de publicidade ou rastreamento.",
        }),
      },

      changes: {
        title: t({
          en: "Changes to this policy",
          pt: "Alterações a esta política",
        }),
        body: t({
          en: "We may update this policy from time to time. We will notify you of any significant changes by email. Continued use of SpoolIQ after changes constitutes acceptance of the updated policy.",
          pt: "Podemos actualizar esta política periodicamente. Notificaremos sobre alterações significativas por email. A utilização continuada da SpoolIQ após as alterações constitui aceitação da política actualizada.",
        }),
      },

      contact: {
        title: t({ en: "Contact", pt: "Contacto" }),
        body: t({
          en: "If you have any questions about this privacy policy, please contact us at privacy@spooliq.app.",
          pt: "Se tiveres alguma questão sobre esta política de privacidade, contacta-nos em privacy@spooliq.app.",
        }),
      },
    },
  },
} satisfies DeclarationContent;

export default privacyContent;
