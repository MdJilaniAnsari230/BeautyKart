
package com.business.repositories;

import java.util.Optional;

import org.springframework.data.repository.CrudRepository;

import com.business.entities.User;

public interface UserRepository extends CrudRepository<User, Integer> {

    Optional<User> findByUserEmail(String userEmail);

    boolean existsByUserEmail(String userEmail);

    boolean existsByUserNumber(Long userNumber);
}
