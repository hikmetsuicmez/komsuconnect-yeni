package com.hikmetsuicmez.komsuconnect_backend.repository;

import com.hikmetsuicmez.komsuconnect_backend.entity.BusinessCategory;
import com.hikmetsuicmez.komsuconnect_backend.entity.BusinessProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface BusinessProfileRepository extends JpaRepository<BusinessProfile, UUID> {

    Optional<BusinessProfile> findByUserId(UUID userId);

    boolean existsByUserId(UUID userId);

    @Query("""
            SELECT bp FROM BusinessProfile bp
            JOIN FETCH bp.user
            WHERE (:city IS NULL OR LOWER(bp.city) = LOWER(:city))
              AND (:category IS NULL OR bp.category = :category)
            """)
    List<BusinessProfile> findAllFiltered(
            @Param("city") String city,
            @Param("category") BusinessCategory category);

    @Query("SELECT DISTINCT bp.city FROM BusinessProfile bp " +
           "WHERE bp.city IS NOT NULL AND bp.city <> '' ORDER BY bp.city")
    List<String> findDistinctCities();

    @Query("SELECT bp FROM BusinessProfile bp JOIN FETCH bp.user WHERE bp.id = :id")
    Optional<BusinessProfile> findByIdWithUser(@Param("id") UUID id);
}
