package Movie_sd.uvnpl.Repositories;

import Movie_sd.uvnpl.Entities.TravelBookings;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TravelRepository extends MongoRepository<TravelBookings,String> {
}
