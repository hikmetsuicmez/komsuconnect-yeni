package com.hikmetsuicmez.komsuconnect_backend.repository;

import com.hikmetsuicmez.komsuconnect_backend.entity.BusinessProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface BusinessProfileRepository extends JpaRepository<BusinessProfile, UUID> {
    Optional<BusinessProfile> findByUserId(UUID userId);
    boolean existsByUserId(UUID userId);

    @Query("SELECT bp FROM BusinessProfile bp JOIN FETCH bp.user")
    List<BusinessProfile> findAllWithUser();
}
