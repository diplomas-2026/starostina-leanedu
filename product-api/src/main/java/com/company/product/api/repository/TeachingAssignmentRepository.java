package com.company.product.api.repository;

import com.company.product.api.entity.AppUser;
import com.company.product.api.entity.GroupEntity;
import com.company.product.api.entity.Subject;
import com.company.product.api.entity.TeachingAssignment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TeachingAssignmentRepository extends JpaRepository<TeachingAssignment, Long> {
    List<TeachingAssignment> findByTeacher(AppUser teacher);
    List<TeachingAssignment> findByGroup(GroupEntity group);
    List<TeachingAssignment> findByTeacherAndGroup(AppUser teacher, GroupEntity group);
    List<TeachingAssignment> findByTeacherAndSubject(AppUser teacher, Subject subject);
    long countByGroup(GroupEntity group);
    long countBySubject(Subject subject);
    void deleteByTeacher(AppUser teacher);
    void deleteBySubject(Subject subject);
    void deleteByGroup(GroupEntity group);
    boolean existsByTeacherAndGroup(AppUser teacher, GroupEntity group);
    boolean existsByTeacherAndGroupAndSubject(AppUser teacher, GroupEntity group, Subject subject);
}
