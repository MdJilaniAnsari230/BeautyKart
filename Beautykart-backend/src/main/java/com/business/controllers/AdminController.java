package com.business.controllers;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseBody;

import com.business.config.SessionAuthenticator;
import com.business.entities.Admin;
import com.business.entities.Product;
import com.business.entities.User;
import com.business.loginCredentials.AdminLogin;
import com.business.services.AdminService;
import com.business.services.ProductService;
import com.business.services.UserService;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * Admin login (JSON + legacy form) and the legacy server-rendered admin console.
 * Authorization for every console path is enforced in SecurityConfig (ROLE_ADMIN).
 * All state-changing console actions are POST (they used to be GET, which made them
 * triggerable from any web page via an image tag).
 */
@Controller
public class AdminController {

    private final AdminService adminService;
    private final UserService userService;
    private final ProductService productService;
    private final SessionAuthenticator sessionAuthenticator;

    public AdminController(AdminService adminService,
                           UserService userService,
                           ProductService productService,
                           SessionAuthenticator sessionAuthenticator) {
        this.adminService = adminService;
        this.userService = userService;
        this.productService = productService;
        this.sessionAuthenticator = sessionAuthenticator;
    }

    // ---------------- login ----------------

    @GetMapping("/adminLogin")
    public String showAdminLogin(Model model) {
        model.addAttribute("adminLogin", new AdminLogin());
        return "Login";
    }

    @PostMapping("/adminLogin")
    public String adminLoginForm(@ModelAttribute("adminLogin") AdminLogin login,
                                 Model model,
                                 HttpServletRequest request,
                                 HttpServletResponse response) {
        Admin admin = adminService.authenticate(login.getEmail(), login.getPassword());
        if (admin != null) {
            sessionAuthenticator.signInAdmin(request, response, admin.getAdminId(), admin.getAdminEmail());
            return "redirect:/services";
        }
        model.addAttribute("error", "Invalid email or password");
        return "Login";
    }

    @PostMapping("/api/admin/login")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> adminLoginApi(
            @RequestBody Map<String, String> body,
            HttpServletRequest request,
            HttpServletResponse response) {

        Admin admin = adminService.authenticate(body.get("email"), body.get("password"));
        if (admin == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Invalid email or password."));
        }
        sessionAuthenticator.signInAdmin(request, response, admin.getAdminId(), admin.getAdminEmail());

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("message", "Admin login successful.");
        result.put("adminEmail", admin.getAdminEmail());
        return ResponseEntity.ok(result);
    }

    @PostMapping("/api/admin/logout")
    @ResponseBody
    public ResponseEntity<Map<String, String>> adminLogout(HttpServletRequest request) {
        sessionAuthenticator.signOut(request);
        return ResponseEntity.ok(Map.of("message", "Logout successful."));
    }

    // ---------------- JSON dashboard (never exposes password hashes) ----------------

    @GetMapping("/api/admin/dashboard")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> dashboard() {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("admins", adminService.getAll().stream().map(a -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("adminId", a.getAdminId());
            m.put("adminName", a.getAdminName());
            m.put("adminEmail", a.getAdminEmail());
            m.put("adminNumber", a.getAdminNumber());
            return m;
        }).toList());
        result.put("users", userService.getAllUser().stream().map(u -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("userId", u.getUserId());
            m.put("userName", u.getUserName());
            m.put("userEmail", u.getUserEmail());
            m.put("userNumber", u.getUserNumber());
            return m;
        }).toList());
        result.put("products", productService.getAllProducts());
        return ResponseEntity.ok(result);
    }

    // ---------------- legacy console ----------------

    @GetMapping("/services")
    public String services(Model model) {
        List<Admin> admins = adminService.getAll();
        List<User> users = userService.getAllUser();
        List<Product> products = productService.getAllProducts();
        model.addAttribute("admins", admins);
        model.addAttribute("users", users);
        model.addAttribute("products", products);
        return "Admin_Page";
    }

    @GetMapping("/addAdmin")
    public String addAdminPage() {
        return "Add_Admin";
    }

    @PostMapping("/addingAdmin")
    public String addAdmin(@ModelAttribute Admin admin) {
        adminService.addAdmin(admin);
        return "redirect:/services";
    }

    @GetMapping("/updateAdmin/{adminId}")
    public String updateAdminPage(@PathVariable("adminId") int id, Model model) {
        model.addAttribute("admin", adminService.getAdmin(id));
        return "Update_Admin";
    }

    @PostMapping("/updatingAdmin/{id}")
    public String updateAdmin(@ModelAttribute Admin admin, @PathVariable("id") int id) {
        adminService.updateAdmin(admin, id);
        return "redirect:/services";
    }

    @PostMapping("/deleteAdmin/{id}")
    public String deleteAdmin(@PathVariable("id") int id, HttpServletRequest request) {
        Object self = request.getSession().getAttribute("adminId");
        if (self instanceof Number && ((Number) self).intValue() == id) {
            throw new IllegalArgumentException("You cannot delete your own admin account.");
        }
        adminService.delete(id);
        return "redirect:/services";
    }

    @GetMapping("/addUser")
    public String addUserPage() {
        return "Add_User";
    }

    @PostMapping("/addingUser")
    public String addUser(@ModelAttribute User user) {
        userService.addUser(user);
        return "redirect:/services";
    }

    @GetMapping("/updateUser/{userId}")
    public String updateUserPage(@PathVariable("userId") int id, Model model) {
        model.addAttribute("user", userService.getUser(id));
        return "Update_User";
    }

    @PostMapping("/updatingUser/{id}")
    public String updateUser(@ModelAttribute User user, @PathVariable("id") int id) {
        userService.updateUser(user, id);
        return "redirect:/services";
    }

    @PostMapping("/deleteUser/{id}")
    public String deleteUser(@PathVariable("id") int id) {
        userService.deleteUser(id);
        return "redirect:/services";
    }

    @GetMapping("/addProduct")
    public String addProductPage() {
        return "Add_Product";
    }

    @PostMapping("/addingProduct")
    public String addProduct(@ModelAttribute Product product) {
        productService.addProduct(product);
        return "redirect:/services";
    }

    @GetMapping("/updateProduct/{productId}")
    public String updateProductPage(@PathVariable("productId") int id, Model model) {
        model.addAttribute("product", productService.getProduct(id));
        return "Update_Product";
    }

    @PostMapping("/updatingProduct/{id}")
    public String updateProduct(@ModelAttribute Product product, @PathVariable("id") int id) {
        productService.updateProduct(product, id);
        return "redirect:/services";
    }

    @PostMapping("/deleteProduct/{id}")
    public String deleteProduct(@PathVariable("id") int id) {
        productService.deleteProduct(id);
        return "redirect:/services";
    }
}
