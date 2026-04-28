package com.example.presensiapi;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org. springframework.data.domain.Pageable;
import org. springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org. springframework.web.bind.annotation .*;


@RestController
@RequestMapping("/api/presensi")
@CrossOrigin(origins = "*")

public class PresensiController {
    @Autowired
    private PresensiRepository repository;

    // get pake pagination
    @GetMapping("/history/{nim}")
    public Page<Presensi> getHistory(
        @PathVariable String nim,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "10") int size) {
            Pageable pageable = PageRequest.of(page, size, Sort.by("id").descending());
            return repository.findByNimMhs(nim, pageable);
        }
    
    // post: simpan absen baru
    @PostMapping
    public Presensi savPresensi(@RequestBody Presensi presensi) {
        return repository.save(presensi);
    }

    // update: mengubah status / data presensi
    @PutMapping("/{id}")
    public ResponseEntity<Presensi> updatePresensi(@PathVariable Long id, @RequestBody Presensi details) {
        return repository. findById(id).map(p -> {
            p.setStatus(details.getStatus());
            p.setJamPresensi(details.getJamPresensi());
            return ResponseEntity.ok(repository.save(p));
        }).orElse(ResponseEntity.notFound().build());
    } 
}
