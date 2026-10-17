package com.business.config;

import java.util.List;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.stereotype.Component;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

/**
 * Single place that turns a successful credential check into an authenticated
 * Spring Security session (role USER or ADMIN). One identity per session.
 */
@Component
public class SessionAuthenticator {

    private final SecurityContextRepository repository =
            new HttpSessionSecurityContextRepository();

    public void signInUser(HttpServletRequest request,
                           HttpServletResponse response,
                           int userId) {
        HttpSession session = prepareSession(request);
        session.setAttribute("userId", userId);
        store(request, response, "user:" + userId, "ROLE_USER");
    }

    public void signInAdmin(HttpServletRequest request,
                            HttpServletResponse response,
                            int adminId,
                            String email) {
        HttpSession session = prepareSession(request);
        session.setAttribute("adminId", adminId);
        session.setAttribute("adminEmail", email);
        store(request, response, "admin:" + adminId, "ROLE_ADMIN");
    }

    public void signOut(HttpServletRequest request) {
        SecurityContextHolder.clearContext();
        HttpSession session = request.getSession(false);
        if (session != null) {
            session.invalidate();
        }
    }

    /** Fresh session id (fixation protection) with any previous identity removed. */
    private HttpSession prepareSession(HttpServletRequest request) {
        HttpSession session = request.getSession(true);
        request.changeSessionId();
        session.removeAttribute("userId");
        session.removeAttribute("adminId");
        session.removeAttribute("adminEmail");
        return session;
    }

    private void store(HttpServletRequest request,
                       HttpServletResponse response,
                       String principal,
                       String role) {
        Authentication auth = UsernamePasswordAuthenticationToken.authenticated(
                principal, null, List.of(new SimpleGrantedAuthority(role)));
        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(auth);
        SecurityContextHolder.setContext(context);
        repository.saveContext(context, request, response);
    }
}
