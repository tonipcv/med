import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

// Regex para detectar URLs no formato /{slug}/{indicador}
const INDICATION_REGEX = /^\/([^\/]+)\/([^\/]+)$/;

// Verificar se o usuário está autenticado
async function isAuthenticated(req: NextRequest): Promise<boolean> {
  const session = await getToken({ 
    req, 
    secret: process.env.NEXTAUTH_SECRET 
  });
  
  return !!session;
}

export async function middleware(req: NextRequest) {
  const { pathname } = new URL(req.url);
  
  // Verificar se é uma rota protegida que requer autenticação
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/profile')) {
    const isLoggedIn = await isAuthenticated(req);
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL('/auth/signin', req.url));
    }
    return NextResponse.next();
  }
  
  // Verificar se é uma rota de indicação para rastreamento
  const match = pathname.match(INDICATION_REGEX);
  if (match) {
    const userSlug = match[1];
    const indicationSlug = match[2];

    // Ignorar rotas conhecidas como api, _next, etc.
    const isSystemRoute = userSlug.startsWith('api') || 
                          userSlug.startsWith('_next') || 
                          userSlug.startsWith('static') || 
                          userSlug === 'favicon.ico';
    
    if (!isSystemRoute && userSlug && indicationSlug) {
      try {
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
    // Rotas protegidas que requerem autenticação
    '/dashboard/:path*',
    '/profile/:path*',
    // Qualquer rota para capturar padrões de indicação
    '/:slug/:indication',
  ],
}; 