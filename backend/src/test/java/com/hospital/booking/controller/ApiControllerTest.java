package com.hospital.booking.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;
import com.hospital.booking.dto.Dtos.*;
import com.hospital.booking.service.AppointmentService;
import com.hospital.booking.service.AuthService;
import com.hospital.booking.service.DoctorService;
import com.hospital.booking.service.PatientService;
import java.math.BigDecimal;
import java.security.Principal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

@ExtendWith(MockitoExtension.class)
class ApiControllerTest {

    private MockMvc authMvc;
    private MockMvc doctorMvc;
    private MockMvc patientMvc;
    private MockMvc appointmentMvc;

    private final ObjectMapper objectMapper = new ObjectMapper().registerModule(new JavaTimeModule());

    @Mock
    private AuthService authService;

    @Mock
    private DoctorService doctorService;

    @Mock
    private PatientService patientService;

    @Mock
    private AppointmentService appointmentService;

    @InjectMocks
    private AuthController authController;

    @InjectMocks
    private DoctorController doctorController;

    @InjectMocks
    private PatientController patientController;

    @InjectMocks
    private AppointmentController appointmentController;

    private final Principal mockPrincipal = () -> "demo@patient.com";

    @BeforeEach
    void setUp() {
        objectMapper.registerModule(new JavaTimeModule());
        objectMapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        MappingJackson2HttpMessageConverter converter = new MappingJackson2HttpMessageConverter(objectMapper);

        authMvc = MockMvcBuilders.standaloneSetup(authController).setMessageConverters(converter).build();
        doctorMvc = MockMvcBuilders.standaloneSetup(doctorController).setMessageConverters(converter).build();
        patientMvc = MockMvcBuilders.standaloneSetup(patientController).setMessageConverters(converter).build();
        appointmentMvc = MockMvcBuilders.standaloneSetup(appointmentController).setMessageConverters(converter).build();
    }

    // --- 1. AuthController Endpoints ---

    @Test
    @DisplayName("POST /api/auth/login returns 200 with message and JWT token")
    void testLoginEndpoint() throws Exception {
        when(authService.login(any(LoginRequest.class))).thenReturn(new LoginResponse("Login successful", "jwt-token-xyz"));

        authMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(new LoginRequest("demo@patient.com", "Password@123"))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.message").value("Login successful"))
            .andExpect(jsonPath("$.token").value("jwt-token-xyz"));
    }

    @Test
    @DisplayName("POST /api/auth/register returns 201 Created")
    void testRegisterEndpoint() throws Exception {
        PatientDto patient = new PatientDto(2L, "New Patient", "new@patient.com", "9876543210", null, null, null, null);
        when(authService.register(any(RegisterRequest.class))).thenReturn(new AuthResponse("token-123", patient));

        RegisterRequest req = new RegisterRequest("New Patient", "new@patient.com", "Password@123", "9876543210", null, null);

        authMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.token").value("token-123"));
    }

    @Test
    @DisplayName("POST /api/auth/logout returns 204 No Content")
    void testLogoutEndpoint() throws Exception {
        authMvc.perform(post("/api/auth/logout"))
            .andExpect(status().isNoContent());
    }

    // --- 2. DoctorController Endpoints ---

    @Test
    @DisplayName("GET /api/doctors returns list of doctors")
    void testGetDoctorsEndpoint() throws Exception {
        DoctorDto doc = new DoctorDto(1L, "Dr. Anita Deshmukh", "Cardiology", "MD, DM", 16, new BigDecimal("800.00"), "Cardiologist");
        when(doctorService.search(any(), any())).thenReturn(List.of(doc));

        doctorMvc.perform(get("/api/doctors"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].fullName").value("Dr. Anita Deshmukh"))
            .andExpect(jsonPath("$[0].specialization").value("Cardiology"));
    }

    @Test
    @DisplayName("GET /api/doctors/specializations returns distinct list")
    void testGetSpecializationsEndpoint() throws Exception {
        when(doctorService.specializations()).thenReturn(List.of("Cardiology", "Dermatology", "Pediatrics"));

        doctorMvc.perform(get("/api/doctors/specializations"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0]").value("Cardiology"));
    }

    @Test
    @DisplayName("GET /api/doctors/{id}/dates returns available dates")
    void testGetDoctorDatesEndpoint() throws Exception {
        LocalDate date = LocalDate.now().plusDays(2);
        when(doctorService.availableDates(1L)).thenReturn(List.of(date));

        doctorMvc.perform(get("/api/doctors/1/dates"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0]").value(date.toString()));
    }

    // --- 3. PatientController Endpoints ---

    @Test
    @DisplayName("GET /api/patients/me returns patient profile")
    void testGetMeAuthorized() throws Exception {
        PatientDto p = new PatientDto(1L, "Demo Patient", "demo@patient.com", "9876543210", null, "Female", "Pune", "B+");
        when(patientService.me("demo@patient.com")).thenReturn(p);

        patientMvc.perform(get("/api/patients/me").principal(mockPrincipal))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.fullName").value("Demo Patient"))
            .andExpect(jsonPath("$.bloodGroup").value("B+"));
    }

    // --- 4. AppointmentController Endpoints ---

    @Test
    @DisplayName("POST /api/appointments books appointment and returns 201 Created")
    void testBookAppointmentEndpoint() throws Exception {
        DoctorDto doc = new DoctorDto(1L, "Dr. Anita Deshmukh", "Cardiology", null, 16, new BigDecimal("800.00"), null);
        AppointmentDto appt = new AppointmentDto(10L, "APT-TEST-001", doc, 100L, LocalDate.now().plusDays(1),
            LocalTime.of(10, 0), LocalTime.of(10, 30), "Checkup", "PENDING", null, null, true, true, LocalDateTime.now());

        when(appointmentService.book(eq("demo@patient.com"), any(BookRequest.class)))
            .thenReturn(new ConfirmationDto("Booked successfully", appt));

        appointmentMvc.perform(post("/api/appointments")
                .principal(mockPrincipal)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(new BookRequest(100L, "Checkup"))))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.appointment.referenceCode").value("APT-TEST-001"));
    }

    @Test
    @DisplayName("GET /api/appointments returns patient appointment list")
    void testListAppointmentsEndpoint() throws Exception {
        DoctorDto doc = new DoctorDto(1L, "Dr. Anita Deshmukh", "Cardiology", null, 16, new BigDecimal("800.00"), null);
        AppointmentDto appt = new AppointmentDto(10L, "APT-TEST-001", doc, 100L, LocalDate.now().plusDays(1),
            LocalTime.of(10, 0), LocalTime.of(10, 30), "Checkup", "CONFIRMED", null, null, true, true, LocalDateTime.now());

        when(appointmentService.list(eq("demo@patient.com"), eq("upcoming"))).thenReturn(List.of(appt));

        appointmentMvc.perform(get("/api/appointments?type=upcoming").principal(mockPrincipal))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].referenceCode").value("APT-TEST-001"))
            .andExpect(jsonPath("$[0].status").value("CONFIRMED"));
    }

    @Test
    @DisplayName("POST /api/appointments/{id}/cancel cancels appointment")
    void testCancelAppointmentEndpoint() throws Exception {
        DoctorDto doc = new DoctorDto(1L, "Dr. Anita Deshmukh", "Cardiology", null, 16, new BigDecimal("800.00"), null);
        AppointmentDto appt = new AppointmentDto(10L, "APT-TEST-001", doc, 100L, LocalDate.now().plusDays(1),
            LocalTime.of(10, 0), LocalTime.of(10, 30), "Checkup", "CANCELLED", null, "No longer needed", false, false, LocalDateTime.now());

        when(appointmentService.cancel(eq("demo@patient.com"), eq(10L), any()))
            .thenReturn(appt);

        appointmentMvc.perform(post("/api/appointments/10/cancel")
                .principal(mockPrincipal)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(new CancelRequest("No longer needed"))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("CANCELLED"))
            .andExpect(jsonPath("$.cancellationReason").value("No longer needed"));
    }
}
