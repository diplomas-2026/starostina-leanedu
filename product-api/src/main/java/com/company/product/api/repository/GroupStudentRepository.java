package com.company.product.api.repository;

import com.company.product.api.entity.GroupEntity;
import com.company.product.api.entity.GroupStudent;
import com.company.product.api.entity.AppUser;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface GroupStudentRepository extends JpaRepository<GroupStudent, Long> {
    List<GroupStudent> findByGroup(GroupEntity group);
    List<GroupStudent> findByStudent(AppUser student);
    boolean existsByGroupAndStudent(GroupEntity group, AppUser student);
}
