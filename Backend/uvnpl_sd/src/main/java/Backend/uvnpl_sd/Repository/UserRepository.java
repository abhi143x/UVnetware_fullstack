package Backend.uvnpl_sd.Repository;

import Backend.uvnpl_sd.Entity.User;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface UserRepository extends MongoRepository<User, String> {

}
