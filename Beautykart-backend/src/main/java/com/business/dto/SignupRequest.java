package com.business.dto;

/** Accepted signup fields only (prevents client-supplied userId / profileImagePath). */
public class SignupRequest {
    private String userName;
    private String userEmail;
    private String userPassword;
    private Long userNumber;

    public String getUserName() { return userName; }
    public void setUserName(String userName) { this.userName = userName; }
    public String getUserEmail() { return userEmail; }
    public void setUserEmail(String userEmail) { this.userEmail = userEmail; }
    public String getUserPassword() { return userPassword; }
    public void setUserPassword(String userPassword) { this.userPassword = userPassword; }
    public Long getUserNumber() { return userNumber; }
    public void setUserNumber(Long userNumber) { this.userNumber = userNumber; }
}
