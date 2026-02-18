package Movie_sd.uvnpl.Controllers;

import Movie_sd.uvnpl.Entities.TravelBookings;
import Movie_sd.uvnpl.Services.BookingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/Bookings")
public class BookingController {

    @Autowired
    private BookingService bookingService;

    @PostMapping
    public boolean bookticket(@RequestBody TravelBookings mybooking){
        bookingService.bookticket(mybooking);
        return true;
    }

    @GetMapping
    public List<TravelBookings> getAll(){
        return bookingService.getAll();
    }
    @GetMapping("/id/{myid}")
    public TravelBookings getTicketbyId(@PathVariable String myid){
        return null;
    }

    @DeleteMapping("/id/{myid}")
    public TravelBookings CancelById(@PathVariable String myid){
        return null;
    }
}
