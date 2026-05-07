package com.hikmetsuicmez.komsuconnect_backend.repository;

import com.hikmetsuicmez.komsuconnect_backend.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface ProductRepository extends JpaRepository<Product, UUID> {
    @Query("SELECT p FROM Product p JOIN FETCH p.businessProfile WHERE p.businessProfile.id = :businessProfileId")
    List<Product> findByBusinessProfileId(@Param("businessProfileId") UUID businessProfileId);

    @Query("SELECT p.businessProfile.id, COUNT(p) FROM Product p GROUP BY p.businessProfile.id")
    List<Object[]> findProductCountsByBusinessProfile();
}
