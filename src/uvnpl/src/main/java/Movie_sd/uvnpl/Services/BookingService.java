package Movie_sd.uvnpl.Services;

import Movie_sd.uvnpl.Entities.TravelBookings;
import Movie_sd.uvnpl.Repositories.TravelRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class BookingService {

    @Autowired
    private TravelRepository travelRepository;

    public void bookticket(TravelBookings travelBookings){
        travelRepository.save(travelBookings);
    }

    public List<TravelBookings> getAll(){
        return travelRepository.findAll();
    }
}
