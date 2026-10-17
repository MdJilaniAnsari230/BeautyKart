package com.business.config;

import java.io.IOException;
import java.util.Set;

import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * CSRF defence for the JSON API (which is exempt from Spring's token-based CSRF):
 * every state-changing /api request must carry the custom header
 * "X-Requested-With". Browsers cannot attach a custom header to a cross-site
 * form post, and a cross-origin fetch with it triggers a CORS preflight that only
 * the configured origins pass.
 */
public class ApiRequestHeaderFilter extends OncePerRequestFilter {

    private static final Set<String> UNSAFE = Set.of("POST", "PUT", "PATCH", "DELETE");

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        return !path.startsWith("/api/") || !UNSAFE.contains(request.getMethod());
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain chain)
            throws ServletException, IOException {

        if (request.getHeader("X-Requested-With") == null) {
            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
            response.setContentType("application/json");
            response.getWriter().write("{\"message\":\"Missing required request header.\"}");
            return;
        }
        chain.doFilter(request, response);
    }
}
