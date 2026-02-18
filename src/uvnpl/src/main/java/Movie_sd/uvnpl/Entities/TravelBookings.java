package Movie_sd.uvnpl.Entities;

import lombok.Data;
import lombok.Getter;
import lombok.Setter;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.lang.annotation.Documented;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
@Document(collection = "AllBookings")
public class TravelBookings {

    @Id
    private String id;

    private String FromLocation;

    private String ToLocation;

    private LocalDate travelDate;

    private LocalDateTime BookingDate;
}
