import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Lang = "pt" | "en";

const KEY = "peticiona_lang";

const dict = {
  en: {
    signIn: "Sign in",
    createAccount: "Create an account",
    resetPassword: "Reset your password",
    email: "Email",
    password: "Password",
    signUp: "Sign up",
    sendResetLink: "Send reset link",
    noAccount: "No account? Sign up",
    forgotPassword: "Forgot password?",
    backToSignIn: "Back to sign in",
    checkEmail: "Check your email to confirm your account.",
    resetSent: "If that email has an account, a reset link is on its way.",
    somethingWrong: "Something went wrong",
    youreSignedIn: "You're signed in",
    signedInAs: "Signed in as {email}.",
    openDemo: "Open demo",
    signOut: "Sign out",
    setNewPassword: "Set a new password",
    newPassword: "New password",
    savePassword: "Save password",
    passwordUpdated: "Your password was updated. You can close this page.",
    connectTo: "Connect {client} to Peticiona",
    consentBody: "{client} will be able to send prompts to the demo's Claude models as you{email}.",
    returnsTo: "Returns to:",
    shareEmail: "Share your email address",
    shareProfile: "Share your basic profile",
    additionalPerm: "Additional permission requested: {scope}",
    useAskClaude: 'Use the "Ask Claude" tool',
    noBypass: "This does not bypass this app's permissions.",
    approve: "Approve",
    cancelConnection: "Cancel connection",
    noRedirect: "No redirect was returned. Please try again.",
  },
  pt: {
    signIn: "Entrar",
    createAccount: "Criar uma conta",
    resetPassword: "Redefinir sua senha",
    email: "E-mail",
    password: "Senha",
    signUp: "Cadastrar",
    sendResetLink: "Enviar link de redefinição",
    noAccount: "Não tem conta? Cadastre-se",
    forgotPassword: "Esqueceu a senha?",
    backToSignIn: "Voltar para entrar",
    checkEmail: "Verifique seu e-mail para confirmar sua conta.",
    resetSent: "Se esse e-mail tiver uma conta, um link de redefinição está a caminho.",
    somethingWrong: "Algo deu errado",
    youreSignedIn: "Você entrou",
    signedInAs: "Você entrou como {email}.",
    openDemo: "Abrir demo",
    signOut: "Sair",
    setNewPassword: "Defina uma nova senha",
    newPassword: "Nova senha",
    savePassword: "Salvar senha",
    passwordUpdated: "Sua senha foi atualizada. Você pode fechar esta página.",
    connectTo: "Conectar {client} ao Peticiona",
    consentBody: "{client} poderá enviar prompts aos modelos Claude do demo como você{email}.",
    returnsTo: "Retorna para:",
    shareEmail: "Compartilhar seu endereço de e-mail",
    shareProfile: "Compartilhar seu perfil básico",
    additionalPerm: "Permissão adicional solicitada: {scope}",
    useAskClaude: 'Usar a ferramenta "Ask Claude"',
    noBypass: "Isso não ignora as permissões deste app.",
    approve: "Aprovar",
    cancelConnection: "Cancelar conexão",
    noRedirect: "Nenhum redirecionamento foi retornado. Tente novamente.",
  },
} as const;

export type DictKey = keyof (typeof dict)["en"];

type LangCtx = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: DictKey, vars?: Record<string, string>) => string;
};

const Ctx = createContext<LangCtx>({
  lang: "pt",
  setLang: () => {},
  t: (k) => dict.pt[k],
});

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("pt");

  useEffect(() => {
    const saved = localStorage.getItem(KEY);
    if (saved === "en" || saved === "pt") setLangState(saved);
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    localStorage.setItem(KEY, l);
  };

  const t = (key: DictKey, vars?: Record<string, string>) => {
    let s: string = dict[lang][key];
    if (vars) for (const [k, v] of Object.entries(vars)) s = s.replace(`{${k}}`, v);
    return s;
  };

  return <Ctx.Provider value={{ lang, setLang, t }}>{children}</Ctx.Provider>;
}

export function useLang() {
  return useContext(Ctx);
}

export function LangToggle({ className = "" }: { className?: string }) {
  const { lang, setLang } = useLang();
  return (
    <div className={`flex items-center gap-1 text-xs ${className}`}>
      <button
        onClick={() => setLang("pt")}
        className={lang === "pt" ? "font-semibold text-foreground" : "text-muted-foreground hover:text-foreground"}
      >
        PT
      </button>
      <span className="text-muted-foreground">·</span>
      <button
        onClick={() => setLang("en")}
        className={lang === "en" ? "font-semibold text-foreground" : "text-muted-foreground hover:text-foreground"}
      >
        EN
      </button>
    </div>
  );
}
