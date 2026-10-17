
package com.business.config;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

import com.business.entities.Admin;
import com.business.services.AdminService;

@Component
public class AdminBootstrap implements ApplicationRunner {

    private final AdminService adminService;
    private final Environment environment;

    public AdminBootstrap(
            AdminService adminService,
            Environment environment) {
        this.adminService = adminService;
        this.environment = environment;
    }

    @Override
    public void run(ApplicationArguments args) {

        // Create the first admin only if none exists
        if (!adminService.getAll().isEmpty()) {
            return;
        }

        String name = environment.getProperty("INITIAL_ADMIN_NAME");
        String email = environment.getProperty("INITIAL_ADMIN_EMAIL");
        String password = environment.getProperty("INITIAL_ADMIN_PASSWORD");
        String number = environment.getProperty("INITIAL_ADMIN_NUMBER");

        // Do not create an account if required values are missing
        if (isBlank(name) || isBlank(email) || isBlank(password)) {
            System.out.println(
                "Initial admin not created. Set the INITIAL_ADMIN environment variables."
            );
            return;
        }

        Admin admin = new Admin();
        admin.setAdminName(name);
        admin.setAdminEmail(email);
        admin.setAdminPassword(password);
        admin.setAdminNumber(number);

        // AdminService hashes the password using BCrypt
        adminService.addAdmin(admin);

        System.out.println("Initial admin account created successfully.");
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
