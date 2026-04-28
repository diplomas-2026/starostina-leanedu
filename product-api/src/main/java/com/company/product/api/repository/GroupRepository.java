package com.company.product.api.repository;

import com.company.product.api.entity.GroupEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface GroupRepository extends JpaRepository<GroupEntity, Long> {
    Optional<GroupEntity> findByCodeIgnoreCase(String code);
}
