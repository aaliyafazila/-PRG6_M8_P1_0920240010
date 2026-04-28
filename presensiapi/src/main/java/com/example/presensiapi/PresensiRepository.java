package com.example.presensiapi;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org. springframework. data. jpa.repository. JpaRepository;

public interface PresensiRepository extends JpaRepository<Presensi, Long> {
    Page<Presensi> findByNimMhs(String nimMhs, Pageable pageable);
}