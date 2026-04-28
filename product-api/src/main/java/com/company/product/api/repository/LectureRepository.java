package com.company.product.api.repository;

import com.company.product.api.entity.Lecture;
import com.company.product.api.entity.AppUser;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface LectureRepository extends JpaRepository<Lecture, Long> {
    List<Lecture> findByPublishedTrue();
    List<Lecture> findByCreatedBy(AppUser user);
}
