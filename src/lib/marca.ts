// Nome e endereços da marca (replica/brand.md). Trocar o nome é mudar aqui; os
// únicos textos fixos fora daqui são os emails de login do Supabase
// (supabase/templates e os assuntos em supabase/config.toml).
//
// O domínio ainda precisa ser registrado (Registro.br): ver as checagens em
// replica/brand.md antes de gastar com o nome.
export const MARCA = {
  nome: "Chamaqui",
  dominio: "chamaqui.com.br",
  site: "https://chamaqui.com.br",
  remetente: "Chamaqui <ola@chamaqui.com.br>",
  plano: "Chamaqui Pro",
} as const;
