package com.hospital.booking.controller;

import static com.hospital.booking.dto.Dtos.*;

import com.hospital.booking.service.AppointmentService;
import jakarta.validation.Valid;
import java.security.Principal;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/appointments")
public class AppointmentController {
    private final AppointmentService service;

    public AppointmentController(AppointmentService service) { this.service = service; }

    private String patientEmail(Principal p) {
        if (p == null || p.getName() == null || p.getName().isBlank()) {
            throw new com.hospital.booking.exception.ApiException(HttpStatus.UNAUTHORIZED, "Please log in to continue.");
        }
        return p.getName();
    }

    @PostMapping(path = {"", "/", "/book", "/book/"})
    @ResponseStatus(HttpStatus.CREATED)
    public ConfirmationDto book(Principal p, @Valid @RequestBody BookRequest req) {
        return service.book(patientEmail(p), req);
    }

    /** type = upcoming | past | all (default) */
    @GetMapping(path = {"", "/"})
    public List<AppointmentDto> list(Principal p, @RequestParam(defaultValue = "all") String type) {
        return service.list(patientEmail(p), type);
    }

    @GetMapping(path = {"/history", "/history/"})
    public List<HistoryEventDto> allHistory(Principal p) { return service.allHistory(patientEmail(p)); }

    @GetMapping(path = {"/{id}", "/{id}/"})
    public AppointmentDto get(Principal p, @PathVariable Long id) { return service.get(patientEmail(p), id); }

    @GetMapping(path = {"/{id}/history", "/{id}/history/"})
    public List<HistoryEventDto> history(Principal p, @PathVariable Long id) {
        return service.historyFor(patientEmail(p), id);
    }

    @PutMapping(path = {"/{id}/reschedule", "/{id}/reschedule/"})
    public ConfirmationDto reschedule(Principal p, @PathVariable Long id,
                                      @Valid @RequestBody RescheduleRequest req) {
        return service.reschedule(patientEmail(p), id, req);
    }

    @PostMapping(path = {"/{id}/cancel", "/{id}/cancel/"})
    public AppointmentDto cancel(Principal p, @PathVariable Long id,
                                 @RequestBody(required = false) @Valid CancelRequest req) {
        return service.cancel(patientEmail(p), id, req);
    }
}
