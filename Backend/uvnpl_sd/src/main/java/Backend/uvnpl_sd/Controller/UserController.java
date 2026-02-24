package Backend.uvnpl_sd.Controller;

import Backend.uvnpl_sd.Entity.Bookings;
import Backend.uvnpl_sd.Entity.User;
import Backend.uvnpl_sd.Services.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/Login")
class UserController {

    @Autowired
    private UserService userservice;

    @PostMapping
    public User createuser(@RequestBody User user){
        userservice.saveuser(user);
        System.out.println(user);
        return user;
    }

    @GetMapping
    public List<User> getAll(){
        return userservice.getAll();
    }
}
