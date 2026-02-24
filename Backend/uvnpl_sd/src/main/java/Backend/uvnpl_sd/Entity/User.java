package Backend.uvnpl_sd.Entity;

import jdk.jfr.DataAmount;
import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.HashMap;
import java.util.Map;
@Data
@Document(collection = "AllUsers")
public class User {

    @Id
    private String id;

    private String username;

    private String password;

    private Map<Long ,Bookings> allbookings= new HashMap<>();

}
