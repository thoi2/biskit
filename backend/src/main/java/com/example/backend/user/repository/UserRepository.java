package com.example.backend.user.repository;

import com.example.backend.common.enums.OAuth2Provider;
import com.example.backend.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    Optional<User> findByOauth2ProviderAndOauth2ProviderId(
        OAuth2Provider oauth2Provider,
        String oauth2ProviderId
    );
}