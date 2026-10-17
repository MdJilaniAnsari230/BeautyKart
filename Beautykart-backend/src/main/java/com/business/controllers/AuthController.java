package com.business.controllers;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.business.config.SessionAuthenticator;
import com.business.dto.SignupRequest;
import com.business.entities.User;
import com.business.services.UserService;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private static final long MAX_IMAGE_BYTES = 2L * 1024 * 1024;

    private final UserService userService;
    private final SessionAuthenticator sessionAuthenticator;

    @Value("${app.upload.profile-dir:uploads/profile-images}")
    private String profileUploadDir;

    public AuthController(UserService userService,
                          SessionAuthenticator sessionAuthenticator) {
        this.userService = userService;
        this.sessionAuthenticator = sessionAuthenticator;
    }

    @PostMapping("/signup")
    public ResponseEntity<Map<String, Object>> signup(
            @RequestBody SignupRequest request,
            HttpServletRequest servletRequest,
            HttpServletResponse servletResponse) {

        // Validation / duplicates throw IllegalArgumentException (400) or
        // ConflictException (409); GlobalExceptionHandler turns them into JSON.
        User saved = userService.registerUser(request);
        sessionAuthenticator.signInUser(servletRequest, servletResponse, saved.getUserId());

        Map<String, Object> body = userBody(saved);
        body.put("message", "Signup successful.");
        return ResponseEntity.status(HttpStatus.CREATED).body(body);
    }

    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(
            @RequestBody Map<String, String> request,
            HttpServletRequest servletRequest,
            HttpServletResponse servletResponse) {

        User user = userService.authenticate(
                request.get("userEmail"), request.get("userPassword"));

        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Invalid email or password."));
        }

        sessionAuthenticator.signInUser(servletRequest, servletResponse, user.getUserId());

        Map<String, Object> body = userBody(user);
        body.put("message", "Login successful.");
        return ResponseEntity.ok(body);
    }

    @GetMapping("/me")
    public ResponseEntity<Map<String, Object>> currentUser(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        Object userId = session == null ? null : session.getAttribute("userId");

        if (!(userId instanceof Number)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Please log in."));
        }

        User user = userService.getUser(((Number) userId).intValue());
        if (user == null) {
            session.invalidate();
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Please log in again."));
        }
        return ResponseEntity.ok(userBody(user));
    }

    @PostMapping("/logout")
    public ResponseEntity<Map<String, String>> logout(HttpServletRequest request) {
        sessionAuthenticator.signOut(request);
        return ResponseEntity.ok(Map.of("message", "Logout successful."));
    }

    @PostMapping(value = "/profile-image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, Object>> uploadProfileImage(
            @RequestParam("file") MultipartFile file,
            HttpServletRequest request) throws IOException {

        HttpSession session = request.getSession(false);
        Object userId = session == null ? null : session.getAttribute("userId");
        if (!(userId instanceof Number)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Please log in first."));
        }

        if (file == null || file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Please select an image."));
        }
        if (file.getSize() > MAX_IMAGE_BYTES) {
            return ResponseEntity.badRequest().body(Map.of("message", "Image must be 2 MB or smaller."));
        }

        // Do not trust the client-supplied Content-Type: check the file signature too.
        byte[] bytes = file.getBytes();
        String extension = detectImageExtension(bytes);
        if (extension == null) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Only JPG, PNG and WEBP images are allowed."));
        }

        Path dir = Paths.get(profileUploadDir).toAbsolutePath().normalize();
        Files.createDirectories(dir);
        String filename = UUID.randomUUID() + extension;
        Path destination = dir.resolve(filename).normalize();
        if (!destination.startsWith(dir)) {
            return ResponseEntity.badRequest().body(Map.of("message", "Invalid image path."));
        }
        Files.write(destination, bytes);

        User user = userService.updateProfileImage(
                ((Number) userId).intValue(), "/uploads/profile-images/" + filename);

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("message", "Profile photo updated successfully.");
        body.put("profileImagePath", user.getProfileImagePath());
        return ResponseEntity.ok(body);
    }

    private static String detectImageExtension(byte[] b) {
        if (b.length >= 3 && (b[0] & 0xFF) == 0xFF && (b[1] & 0xFF) == 0xD8 && (b[2] & 0xFF) == 0xFF) {
            return ".jpg";
        }
        if (b.length >= 8 && (b[0] & 0xFF) == 0x89 && b[1] == 'P' && b[2] == 'N' && b[3] == 'G') {
            return ".png";
        }
        if (b.length >= 12 && b[0] == 'R' && b[1] == 'I' && b[2] == 'F' && b[3] == 'F'
                && b[8] == 'W' && b[9] == 'E' && b[10] == 'B' && b[11] == 'P') {
            return ".webp";
        }
        return null;
    }

    private static Map<String, Object> userBody(User user) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("userId", user.getUserId());
        body.put("userName", user.getUserName());
        body.put("userEmail", user.getUserEmail());
        body.put("userNumber", user.getUserNumber());
        body.put("profileImagePath", user.getProfileImagePath());
        return body;
    }
}
