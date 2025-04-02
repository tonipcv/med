import { NextRequest, NextResponse } from 'next/server';

// Regex para detectar URLs no formato /{slug}/{indicador}
const INDICATION_REGEX = /^\/([^\/]+)\/([^\/]+)$/;

export async function middleware(req: NextRequest) {
  const url = new URL(req.url);
  const { pathname, searchParams } = url;
  
  // Verificar se é uma rota de indicação
  const match = pathname.match(INDICATION_REGEX);
  if (match) {
    const userSlug = match[1];
    const indicationSlug = match[2];

    if (userSlug && indicationSlug) {
      try {
        // Capturar parâmetros UTM
        const utmSource = searchParams.get('utm_source') || null;
        const utmMedium = searchParams.get('utm_medium') || null;
        const utmCampaign = searchParams.get('utm_campaign') || null;
        const utmTerm = searchParams.get('utm_term') || null;
        const utmContent = searchParams.get('utm_content') || null;

        // Não aguardar a resposta para não atrasar o carregamento da página
        fetch(`${req.nextUrl.origin}/api/track`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Forwarded-For': req.headers.get('x-forwarded-for') || 'unknown',
            'User-Agent': req.headers.get('user-agent') || 'unknown',
          },
          body: JSON.stringify({
            type: 'click',
            userSlug,
            indicationSlug,
            utmSource,
            utmMedium,
            utmCampaign,
            utmTerm,
            utmContent
          }),
        }).catch(err => {
          // Ignorar erros de rastreamento para não impactar a experiência do usuário
          console.error('Erro ao rastrear clique:', err);
        });
      } catch (error) {
        // Ignorar erros no middleware para garantir que a navegação continue
        console.error('Erro no middleware:', error);
      }
    }
  }

  // Sempre permitir que a navegação continue
  return NextResponse.next();
}

// Configurar quais caminhos o middleware deve processar
export const config = {
  matcher: [
    // Corresponder a qualquer caminho que não comece com api/, _next/, ou static/
    '/((?!api|_next|static|dashboard|auth|profile|favicon.ico).*)',
  ],
}; 