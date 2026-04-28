package com.company.product.api.service;

import com.company.product.api.dto.LectureDtos;
import com.company.product.api.entity.AppUser;
import com.company.product.api.entity.Lecture;
import com.company.product.api.entity.Role;
import com.company.product.api.repository.LectureRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.time.OffsetDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class LectureService {
    private final LectureRepository lectureRepository;

    public List<LectureDtos.LectureItem> list(AppUser user) {
        List<Lecture> lectures;
        if (user.getRole() == Role.STUDENT) {
            lectures = lectureRepository.findByPublishedTrue();
        } else if (user.getRole() == Role.TEACHER) {
            lectures = lectureRepository.findByCreatedBy(user);
        } else {
            lectures = lectureRepository.findAll();
        }
        return lectures.stream().map(this::toItem).toList();
    }

    public LectureDtos.LectureItem getById(Long id, AppUser user) {
        Lecture lecture = lectureRepository.findById(id)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Лекция не найдена"));
        if (user.getRole() == Role.STUDENT && !lecture.isPublished()) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Недостаточно прав");
        }
        if (user.getRole() == Role.TEACHER && (lecture.getCreatedBy() == null || !lecture.getCreatedBy().getId().equals(user.getId()))) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Недостаточно прав");
        }
        return toItem(lecture);
    }

    public LectureDtos.LectureItem create(LectureDtos.LectureRequest request, AppUser user) {
        Lecture lecture = new Lecture();
        lecture.setTitle(request.title());
        lecture.setSummary(request.summary());
        lecture.setContent(request.content());
        lecture.setPublished(false);
        lecture.setCreatedBy(user);
        lecture.setCreatedAt(OffsetDateTime.now());
        lecture.setUpdatedAt(OffsetDateTime.now());
        return toItem(lectureRepository.save(lecture));
    }

    public LectureDtos.LectureItem update(Long id, LectureDtos.LectureRequest request, AppUser teacher) {
        Lecture lecture = lectureRepository.findById(id)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Лекция не найдена"));
        if (lecture.getCreatedBy() == null || !lecture.getCreatedBy().getId().equals(teacher.getId())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Недостаточно прав");
        }
        lecture.setTitle(request.title());
        lecture.setSummary(request.summary());
        lecture.setContent(request.content());
        lecture.setUpdatedAt(OffsetDateTime.now());
        return toItem(lectureRepository.save(lecture));
    }

    public LectureDtos.LectureItem publish(Long id, AppUser teacher) {
        Lecture lecture = lectureRepository.findById(id)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Лекция не найдена"));
        if (lecture.getCreatedBy() == null || !lecture.getCreatedBy().getId().equals(teacher.getId())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Недостаточно прав");
        }
        lecture.setPublished(true);
        lecture.setUpdatedAt(OffsetDateTime.now());
        return toItem(lectureRepository.save(lecture));
    }

    private LectureDtos.LectureItem toItem(Lecture lecture) {
        return new LectureDtos.LectureItem(
            lecture.getId(),
            lecture.getTitle(),
            lecture.getSummary(),
            lecture.getContent(),
            lecture.isPublished(),
            lecture.getCreatedBy().getFullName()
        );
    }
}
