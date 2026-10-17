package com.business.config;

import java.util.Arrays;
import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.LoginUrlAuthenticationEntryPoint;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.util.matcher.AntPathRequestMatcher;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration
public class SecurityConfig {

    // Server-rendered admin console (Thymeleaf) paths. ADMIN only.
    private static final String[] ADMIN_PAGES = {
        "/services",
        "/addAdmin", "/addingAdmin", "/updateAdmin/**", "/updatingAdmin/**", "/deleteAdmin/**",
        "/addUser", "/addingUser", "/updateUser/**", "/updatingUser/**", "/deleteUser/**",
        "/addProduct", "/addingProduct", "/updateProduct/**", "/updatingProduct/**", "/deleteProduct/**"
    };

    private static final String[] PUBLIC_PAGES_AND_ASSETS = {
        "/home", "/products", "/location", "/about", "/login", "/userlogin", "/selecting",
        "/css/**", "/Images/**", "/Videos/**", "/favicon.ico", "/error",
        "/uploads/profile-images/**"
    };

    @Value("${app.cors.allowed-origins}")
    private String[] allowedOrigins;

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(Arrays.stream(allowedOrigins)
                .map(String::trim)
                .filter(o -> !o.isEmpty() && !o.equals("*"))
                .toList());
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("Content-Type", "X-Requested-With", "Accept"));
        config.setAllowCredentials(true);
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/api/**", config);
        return source;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {

        AntPathRequestMatcher apiMatcher = new AntPathRequestMatcher("/api/**");

        http
            .cors(Customizer.withDefaults())
            // Token-based CSRF stays ON for the server-rendered forms. The JSON API is
            // exempt but protected by ApiRequestHeaderFilter + CORS + SameSite cookies.
            .csrf(csrf -> csrf.ignoringRequestMatchers(apiMatcher))
            .addFilterBefore(new ApiRequestHeaderFilter(), UsernamePasswordAuthenticationFilter.class)
            .authorizeHttpRequests(auth -> auth
                // --- public API ---
                .requestMatchers("/api/health/**").permitAll()
                .requestMatchers(HttpMethod.POST,
                        "/api/auth/signup", "/api/auth/login", "/api/auth/logout").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/auth/me").permitAll()   // returns 401 itself
                .requestMatchers(HttpMethod.GET, "/api/products", "/api/products/**").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/admin/login").permitAll()
                // --- authenticated user API ---
                .requestMatchers("/api/auth/**").hasRole("USER")
                // --- admin API (products write, admin management, dashboard) ---
                .requestMatchers("/api/products/**", "/api/products").hasRole("ADMIN")
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                // --- legacy server-rendered pages ---
                .requestMatchers(HttpMethod.GET, "/adminLogin").permitAll()
                .requestMatchers(HttpMethod.POST, "/adminLogin").permitAll()
                .requestMatchers(ADMIN_PAGES).hasRole("ADMIN")
                .requestMatchers(HttpMethod.GET, PUBLIC_PAGES_AND_ASSETS).permitAll()
                // everything else is denied
                .anyRequest().denyAll()
            )
            .exceptionHandling(ex -> ex
                .defaultAuthenticationEntryPointFor((request, response, e) -> {
                    response.setStatus(401);
                    response.setContentType("application/json");
                    response.getWriter().write("{\"message\":\"Please log in.\"}");
                }, apiMatcher)
                .authenticationEntryPoint(new LoginUrlAuthenticationEntryPoint("/adminLogin"))
                .accessDeniedHandler((request, response, e) -> {
                    if (request.getRequestURI().startsWith("/api/")) {
                        response.setStatus(403);
                        response.setContentType("application/json");
                        response.getWriter().write("{\"message\":\"You do not have permission.\"}");
                    } else {
                        response.sendError(403);
                    }
                })
            )
            .formLogin(form -> form.disable())
            .httpBasic(basic -> basic.disable());

        return http.build();
    }
}
