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

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ConfirmationDto book(Principal p, @Valid @RequestBody BookRequest req) {
        return service.book(p.getName(), req);
    }

    /** type = upcoming | past | all (default) */
    @GetMapping
    public List<AppointmentDto> list(Principal p, @RequestParam(defaultValue = "all") String type) {
        return service.list(p.getName(), type);
    }

    @GetMapping("/history")
    public List<HistoryEventDto> allHistory(Principal p) { return service.allHistory(p.getName()); }

    @GetMapping("/{id}")
    public AppointmentDto get(Principal p, @PathVariable Long id) { return service.get(p.getName(), id); }

    @GetMapping("/{id}/history")
    public List<HistoryEventDto> history(Principal p, @PathVariable Long id) {
        return service.historyFor(p.getName(), id);
    }

    @PutMapping("/{id}/reschedule")
    public ConfirmationDto reschedule(Principal p, @PathVariable Long id,
                                      @Valid @RequestBody RescheduleRequest req) {
        return service.reschedule(p.getName(), id, req);
    }

    @PostMapping("/{id}/cancel")
    public AppointmentDto cancel(Principal p, @PathVariable Long id,
                                 @RequestBody(required = false) @Valid CancelRequest req) {
        return service.cancel(p.getName(), id, req);
    }
}
