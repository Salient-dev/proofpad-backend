const { expect } = require("chai");
const { ethers } = require("hardhat");
const convertToWei = (num) => ethers.utils.parseEther(num.toString());
const convertFromWei = (num) => ethers.utils.formatEther(num);

describe("OpenBadges Suite", function () {
  let owner, linkedIn, company2, jason, leootshudi, johndoe, nonMember, addr4, addrs;
  let OpenBadgeManagerContract, ExperienceManagerContract, CompanyManagerContract, OpenBadgeContract, CategoryManagerContract;
  let openbadge1Address, openbadge2Address;
  const STATUS_PENDING = 0;
  const STATUS_VERIFIED = 1;

  const OPENBADGE1_NAME = "Utilisation d'Excel";
  const OPENBADGE2_NAME = "Développement NodeJS";

  beforeEach(async function () {
    [owner, linkedIn, company2, jason, leootshudi, johndoe, nonMember, addr4, ...addrs] = await ethers.getSigners();

    // Deploy OpenBadgeProfileManager
    const OBManagerFactory = await ethers.getContractFactory("OpenBadgesProfileManager");
    OpenBadgeManagerContract = await OBManagerFactory.deploy();
    await OpenBadgeManagerContract.deployed();

    // Deploy CompanyManager
    const CompanyManagerFactory = await ethers.getContractFactory("CompanyManager");
    CompanyManagerContract = await CompanyManagerFactory.deploy();
    await CompanyManagerContract.deployed();

    // Deploy CategoryManager
    const CategoryManagerFactory = await ethers.getContractFactory("CategoryManager");
    CategoryManagerContract = await CategoryManagerFactory.deploy();
    await CategoryManagerContract.deployed();

    // Deploy ExperienceManager
    const ExperienceManagerFactory = await ethers.getContractFactory("ExperienceManager");
    ExperienceManagerContract = await ExperienceManagerFactory.deploy(CompanyManagerContract.address, CategoryManagerContract.address, OpenBadgeManagerContract.address);
    await ExperienceManagerContract.deployed();
  });

  describe(" I. DEPLOYMENTS", function() {
    it("Should have deployed OpenBadgesProfileManager", async() => {
        expect(OpenBadgeManagerContract.address).to.not.equal(0);
        expect(await OpenBadgeManagerContract.getOwner()).to.equal(owner.address);
    });

    it("Should have deployed CompanyManager", async() => {
        expect(CompanyManagerContract.address).to.not.equal(0);
    }); 

    it("Should have deployed CategoryManager", async() => {
        expect(CategoryManagerContract.address).to.not.equal(0);
    }); 

    it("Should have deployed ExperienceManager", async() => {
        expect(ExperienceManagerContract.address).to.not.equal(0);
    });
  })

  describe("\n    II. CATEGORIES", function() {
    it ("Should have deployed the default categories", async() => {
        const categories = await CategoryManagerContract.getCategories();
        expect(categories.length).to.equal(4);
    });
  })
  
  describe("\n   III. COMPANIES", function() {
    this.beforeEach(async() => {
        await CompanyManagerContract.connect(linkedIn).submitCompany("LinkedIn", "linkedInDidProfileURL.com");
    });

    it("Should allow a company to register", async() => {
        const companies = await CompanyManagerContract.getAllCompanies();
        expect(companies.length).to.equal(1);
    });

    it("Should set the company status to 'Pending' after registration", async() => {
        const company = await CompanyManagerContract.getCompany(linkedIn.address);
        expect(company.status).to.equal(STATUS_PENDING);
    });

    it("Should set the nft count to 0 after registration", async() => {
        const company = await CompanyManagerContract.getCompany(linkedIn.address);
        const nfts = await CompanyManagerContract.getNftContracts(linkedIn.address);
        expect(nfts.length).to.equal(0);
    });

    it("Should restrict the verification of a company to the owner", async() => {
        await expect(CompanyManagerContract.connect(linkedIn).verifyCompany(linkedIn.address)).to.be.reverted;
        const company = await CompanyManagerContract.getCompany(linkedIn.address);
        expect(company.status).to.equal(STATUS_PENDING);
    });
    
    it("Should set the company status to 'Verified' after verification", async() => {
        await CompanyManagerContract.connect(owner).verifyCompany(linkedIn.address);
        const company = await CompanyManagerContract.getCompany(linkedIn.address);
        expect(company.status).to.equal(STATUS_VERIFIED);
    });
  })

  describe("\n    IV. PROFILES", function() {
    this.beforeEach(async() => {
        await OpenBadgeManagerContract.connect(jason).createProfile("jasonprofileURL.com", "attender")
    });

    it("Should allow anybody to create its own user profile", async() => {
        const profile = await OpenBadgeManagerContract.connect(jason).getOwnProfile();
        expect(profile).to.not.equal(0);
        await OpenBadgeManagerContract.connect(leootshudi).createProfile("leootshudiprofileURL.com", "attender");
        const allProfiles = await OpenBadgeManagerContract.getAllProfiles();
        expect(allProfiles.length).to.equal(2);
    });

    it("Should add an organisation to the profile list and the CompanyManager", async() => {
      await OpenBadgeManagerContract.connect(linkedIn).createProfile("linkedInDidProfileURL.com", "company");
      await CompanyManagerContract.connect(linkedIn).submitCompany("LinkedIn", "linkedInDidProfileURL.com");
      const linkedInProfile = await OpenBadgeManagerContract.connect(linkedIn).getOwnProfile();
      expect(linkedInProfile).to.not.equal(0);
      const orgs = await OpenBadgeManagerContract.connect(linkedIn).getAllOrganisations();
      expect(orgs.length).to.equal(1);
      const companies = await CompanyManagerContract.getAllCompanies();
      expect(companies.length).to.equal(1);
    });
  })

  describe("\n    IV. EXPERIENCES", function() {
    this.beforeEach(async() => {
      await CompanyManagerContract.connect(linkedIn).submitCompany("LinkedIn", "linkedInDidProfileURL.com");
      await CompanyManagerContract.connect(owner).verifyCompany(linkedIn.address);
      await OpenBadgeManagerContract.connect(jason).createProfile("jasonprofileURL.com", "attender")
    })

    it("Should not allow a user to submit an experience in a non-existing company", async() => {
      await expect(ExperienceManagerContract.connect(jason).submitExperience("NonExistingCompany", 1, 1, "0x0000000000000000000000000000000000000000")).to.be.revertedWith("Company does not exist");
    });


    it("Should allow any user to submit an experience (to an existing company)", async() => {
      await expect(ExperienceManagerContract.connect(jason).submitExperience("Attended a course", 2, 0, linkedIn.address)).to.emit(ExperienceManagerContract, "ExperienceSubmitted");
      const userExp = await ExperienceManagerContract.getUserExperiences(jason.address);
      expect(userExp.length).to.equal(1);
    });

    it("Should set the experience validate status to false when submitted", async() => {
      await ExperienceManagerContract.connect(jason).submitExperience("Attended a course", 2, 0, linkedIn.address);
      const experience = await ExperienceManagerContract.getAllExperiences();
      console.log(experience);
    });

    it("Should only let the admin validate an experience", async() => {
      await ExperienceManagerContract.connect(jason).submitExperience("Attended a course", 2, 0, linkedIn.address);
      await expect(ExperienceManagerContract.connect(jason).validateExperience(0)).to.be.reverted;
      await expect(ExperienceManagerContract.connect(linkedIn).validateExperience(0)).to.emit(ExperienceManagerContract, "ExperienceValidated");
      // const experience = await ExperienceManagerContract.getAllExperiences()
      // expect(experience[0].validated).to.equal(true);
    });
  })
});